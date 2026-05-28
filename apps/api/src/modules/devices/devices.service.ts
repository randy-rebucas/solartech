import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { createHash, randomBytes } from 'crypto';
import { Device, DeviceDocument } from '../../database/schemas/device.schema';
import { Telemetry, TelemetryDocument } from '../../database/schemas/telemetry.schema';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';
import { MqttService } from '../iot/mqtt.service';
import type { JwtPayload } from '@solartech/shared';
import { CreateDeviceDto, RunDiagnosticsDto, UpdateFirmwareDto } from './dto/device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private model: Model<DeviceDocument>,
    @InjectModel(Telemetry.name) private telemetryModel: Model<TelemetryDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private mqttService: MqttService,
  ) {}

  async create(dto: CreateDeviceDto, user: JwtPayload) {
    const rawAuthToken = randomBytes(24).toString('hex');
    const deviceAuthTokenHash = createHash('sha256').update(rawAuthToken).digest('hex');
    const device = await this.model.create({
      ...dto,
      organizationId: new Types.ObjectId(user.organizationId ?? user.sub),
      solarSystemId: dto.solarSystemId ? new Types.ObjectId(dto.solarSystemId) : undefined,
      ipAddress: dto.ipAddress,
      location:
        dto.latitude != null && dto.longitude != null
          ? { latitude: dto.latitude, longitude: dto.longitude }
          : undefined,
      mqttClientId: `${user.organizationId ?? user.sub}-${dto.type}-${uuid().split('-')[0]}`,
      deviceAuthTokenHash,
      status: 'offline',
    });
    const obj = device.toObject();
    return {
      ...obj,
      deviceAuthToken: rawAuthToken,
      securityNote: 'Store deviceAuthToken securely on the edge device. It is not retrievable later.',
    };
  }

  async findAll(user: JwtPayload, systemId?: string) {
    const filter: Record<string, unknown> = {
      organizationId: new Types.ObjectId(user.organizationId ?? user.sub),
    };
    if (systemId) filter.solarSystemId = new Types.ObjectId(systemId);

    return this.model.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string, user: JwtPayload) {
    const device = await this.model
      .findById(id)
      .populate('solarSystemId', 'name status systemSizeKw')
      .lean();
    if (!device) throw new NotFoundException('Device not found');
    this.checkAccess(device, user);
    return device;
  }

  async updateStatus(id: string, status: string, user: JwtPayload) {
    const device = await this.model.findById(id);
    if (!device) throw new NotFoundException();
    this.checkAccess(device, user);
    device.status = status;
    await device.save();
    return device;
  }

  async sendCommand(id: string, command: object, user: JwtPayload) {
    const device = await this.model.findById(id);
    if (!device) throw new NotFoundException();
    this.checkAccess(device, user);

    this.mqttService.sendCommand(
      user.organizationId ?? user.sub,
      device.solarSystemId?.toString() ?? 'default',
      device.mqttClientId,
      command,
    );
    return { sent: true };
  }

  async delete(id: string, user: JwtPayload) {
    const device = await this.model.findById(id);
    if (!device) throw new NotFoundException();
    this.checkAccess(device, user);
    await device.deleteOne();
    return { deleted: true };
  }

  async getOnlineCount(organizationId: string) {
    return this.model.countDocuments({
      organizationId: new Types.ObjectId(organizationId),
      status: 'online',
    });
  }

  async updateFirmware(id: string, body: UpdateFirmwareDto, user: JwtPayload) {
    const device = await this.model.findById(id);
    if (!device) throw new NotFoundException();
    this.checkAccess(device, user);

    await this.mqttService.sendCommand(
      user.organizationId ?? user.sub,
      device.solarSystemId?.toString() ?? 'default',
      device.mqttClientId,
      {
        action: 'firmware.update',
        version: body.version,
        immediate: body.immediate ?? true,
      },
    );

    device.firmware = body.version;
    device.status = 'maintenance';
    await device.save();

    return {
      sent: true,
      deviceId: String(device._id),
      targetVersion: body.version,
      status: device.status,
    };
  }

  async runDiagnostics(id: string, body: RunDiagnosticsDto, user: JwtPayload) {
    const device = await this.model.findById(id);
    if (!device) throw new NotFoundException();
    this.checkAccess(device, user);

    const latest = await this.telemetryModel
      .findOne({ deviceId: device._id })
      .sort({ timestamp: -1 })
      .lean();

    const metrics = latest?.metrics ?? {};
    const now = new Date();
    const minsSinceSeen = device.lastSeenAt
      ? (now.getTime() - new Date(device.lastSeenAt).getTime()) / 60000
      : Number.POSITIVE_INFINITY;

    const checks = [
      {
        check: 'connectivity',
        ok: minsSinceSeen <= 15,
        details: minsSinceSeen <= 15
          ? `Last seen ${Math.round(minsSinceSeen)} min ago`
          : 'No heartbeat in 15+ minutes',
      },
      {
        check: 'temperature',
        ok: Number(metrics.temperatureCelsius ?? 0) < 70 || metrics.temperatureCelsius == null,
        details: metrics.temperatureCelsius != null
          ? `${Number(metrics.temperatureCelsius).toFixed(1)}°C`
          : 'No temp sensor',
      },
      {
        check: 'grid-frequency',
        ok:
          metrics.frequencyHz == null
          || (Number(metrics.frequencyHz) >= 59.3 && Number(metrics.frequencyHz) <= 60.7),
        details:
          metrics.frequencyHz != null
            ? `${Number(metrics.frequencyHz).toFixed(2)}Hz`
            : 'No frequency telemetry',
      },
      {
        check: 'power-signal',
        ok: metrics.powerOutputW != null || metrics.loadPowerW != null,
        details:
          metrics.powerOutputW != null || metrics.loadPowerW != null
            ? 'Telemetry stream active'
            : 'No power metrics',
      },
    ];

    const failures = checks.filter((c) => !c.ok);
    const healthScore = Math.max(0, Math.round(((checks.length - failures.length) / checks.length) * 100));

    await this.mqttService.sendCommand(
      user.organizationId ?? user.sub,
      device.solarSystemId?.toString() ?? 'default',
      device.mqttClientId,
      {
        action: 'diagnostics.run',
        deep: body.deep ?? false,
        requestedAt: now.toISOString(),
      },
    );

    return {
      deviceId: String(device._id),
      requested: true,
      mode: body.deep ? 'deep' : 'standard',
      healthScore,
      checks,
      latestTelemetryAt: latest?.timestamp ?? null,
      suggestedActions: failures.map((f) =>
        f.check === 'connectivity'
          ? 'Inspect device power and network, then reboot edge device.'
          : f.check === 'temperature'
            ? 'Check ventilation and clean dust filters.'
            : f.check === 'grid-frequency'
              ? 'Verify meter and inverter synchronization with grid.'
              : 'Review telemetry payload format from edge firmware.',
      ),
    };
  }

  async getIotOverview(user: JwtPayload, hours = 24) {
    const orgId = new Types.ObjectId(user.organizationId ?? user.sub);
    const from = new Date(Date.now() - Math.max(1, Math.min(24 * 7, hours)) * 3600_000);

    const [devices, telemetry, alerts] = await Promise.all([
      this.model.find({ organizationId: orgId }).sort({ createdAt: -1 }).lean(),
      this.telemetryModel.aggregate([
        { $match: { timestamp: { $gte: from } } },
        {
          $lookup: {
            from: 'devices',
            localField: 'deviceId',
            foreignField: '_id',
            as: 'device',
          },
        },
        { $unwind: '$device' },
        { $match: { 'device.organizationId': orgId } },
        {
          $group: {
            _id: '$deviceId',
            latestAt: { $max: '$timestamp' },
            latestMetrics: { $first: '$metrics' },
            samples: { $sum: 1 },
          },
        },
      ]),
      this.notificationModel
        .find({
          organizationId: orgId,
          event: { $regex: 'device|iot|alert|warning|fault', $options: 'i' },
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    const telemetryByDevice = new Map(telemetry.map((t) => [String(t._id), t]));
    const enriched = devices.map((d) => {
      const t = telemetryByDevice.get(String(d._id));
      const m = (t?.latestMetrics ?? {}) as Record<string, number | undefined>;
      const healthScore = this.computeHealthScore({
        status: d.status,
        lastSeenAt: d.lastSeenAt,
        temperatureCelsius: m.temperatureCelsius,
        frequencyHz: m.frequencyHz,
      });
      return {
        id: String(d._id),
        name: d.name,
        type: d.type,
        status: d.status,
        serialNumber: d.serialNumber,
        firmware: d.firmware,
        mqttClientId: d.mqttClientId,
        lastSeenAt: d.lastSeenAt,
        location: d.location,
        healthScore,
        latestMetrics: {
          powerOutputW: m.powerOutputW ?? 0,
          loadPowerW: m.loadPowerW ?? 0,
          batteryStateOfCharge: m.batteryStateOfCharge ?? m.batteryLevelPercent ?? null,
          gridPowerW: m.gridPowerW ?? 0,
          irradianceWm2: m.irradianceWm2 ?? null,
          temperatureCelsius: m.temperatureCelsius ?? null,
        },
      };
    });

    const totals = {
      total: devices.length,
      online: devices.filter((d) => d.status === 'online').length,
      warning: devices.filter((d) => d.status === 'warning').length,
      offline: devices.filter((d) => d.status === 'offline' || d.status === 'error').length,
      avgHealthScore: enriched.length
        ? Math.round(enriched.reduce((s, d) => s + d.healthScore, 0) / enriched.length)
        : 0,
    };

    return {
      totals,
      supportedHardware: ['ESP32', 'Raspberry Pi', 'Smart meters', 'Solar inverters', 'Weather sensors'],
      devices: enriched,
      alerts: alerts.map((a) => ({
        id: String(a._id),
        title: a.title,
        body: a.body,
        event: a.event,
        createdAt: a.sentAt ?? (a as { createdAt?: Date }).createdAt,
      })),
    };
  }

  private computeHealthScore(input: {
    status?: string;
    lastSeenAt?: Date;
    temperatureCelsius?: number;
    frequencyHz?: number;
  }) {
    let score = 100;
    if (input.status === 'offline' || input.status === 'error') score -= 35;
    if (input.status === 'warning') score -= 20;
    if (input.lastSeenAt) {
      const mins = (Date.now() - new Date(input.lastSeenAt).getTime()) / 60000;
      if (mins > 60) score -= 20;
      else if (mins > 15) score -= 10;
    }
    if (input.temperatureCelsius != null && input.temperatureCelsius > 70) score -= 20;
    if (
      input.frequencyHz != null
      && (input.frequencyHz < 59.3 || input.frequencyHz > 60.7)
    ) score -= 10;
    return Math.max(0, score);
  }

  private refId(ref: unknown): string | undefined {
    if (ref == null) return undefined;
    if (typeof ref === 'object' && '_id' in (ref as object)) {
      return String((ref as { _id: unknown })._id);
    }
    return String(ref);
  }

  private checkAccess(device: { organizationId: unknown }, user: JwtPayload) {
    if (user.role === 'super_admin') return;
    const orgId = this.refId(device.organizationId);
    if (orgId !== (user.organizationId ?? user.sub)) {
      throw new ForbiddenException();
    }
  }
}
