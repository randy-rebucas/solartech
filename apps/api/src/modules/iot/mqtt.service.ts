import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as mqtt from 'mqtt';
import { createHash } from 'crypto';
import { Device, DeviceDocument } from '../../database/schemas/device.schema';
import { Telemetry, TelemetryDocument } from '../../database/schemas/telemetry.schema';
import { TelemetryGateway } from '../telemetry/telemetry.gateway';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client?: mqtt.MqttClient;

  constructor(
    private config: ConfigService,
    @InjectModel(Device.name)    private deviceModel: Model<DeviceDocument>,
    @InjectModel(Telemetry.name) private telemetryModel: Model<TelemetryDocument>,
    private telemetryGateway: TelemetryGateway,
  ) {}

  onModuleInit() {
    if (!this.config.get<boolean>('app.mqtt.enabled')) {
      this.logger.warn('MQTT disabled (set MQTT_ENABLED=true when the broker is running)');
      return;
    }

    const brokerUrl = this.config.get<string>('app.mqtt.brokerUrl');
    const username  = this.config.get<string>('app.mqtt.username');
    const password  = this.config.get<string>('app.mqtt.password');

    this.client = mqtt.connect(brokerUrl!, {
      clientId:    `solartech-api-${process.pid}`,
      username,
      password,
      reconnectPeriod: 3000,
      clean: true,
      protocol: this.config.get<boolean>('app.mqtt.secure') ? 'mqtts' : 'mqtt',
      rejectUnauthorized: this.config.get<boolean>('app.mqtt.rejectUnauthorized') ?? true,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to MQTT broker');
      // Subscribe to all org telemetry
      this.client!.subscribe('solartech/+/+/+/telemetry', { qos: 1 });
      this.client!.subscribe('solartech/+/+/+/status',    { qos: 1 });
      this.client!.subscribe('solartech/+/+/+/alert',     { qos: 1 });
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload).catch((e) => this.logger.error(e));
    });

    this.client.on('error', (err) => this.logger.error('MQTT error', err));
    this.client.on('offline', () => this.logger.warn('MQTT offline'));
  }

  onModuleDestroy() {
    this.client?.end();
  }

  private async handleMessage(topic: string, payload: Buffer) {
    const parts = topic.split('/');
    if (parts.length < 5) return;

    const [, orgId, systemId, deviceId, messageType] = parts;
    let data: Record<string, unknown>;

    try {
      data = JSON.parse(payload.toString());
    } catch {
      return;
    }

    // Update device last seen
    const authToken = (data.authToken as string | undefined) ?? (data.token as string | undefined);
    const hashed = authToken ? createHash('sha256').update(authToken).digest('hex') : undefined;
    const device = await this.deviceModel
      .findOne({ mqttClientId: deviceId })
      .select('+deviceAuthTokenHash')
      .exec();
    if (!device) return;
    if (device.deviceAuthTokenHash && hashed !== device.deviceAuthTokenHash) {
      this.logger.warn(`Rejected MQTT message with invalid auth token for device ${deviceId}`);
      return;
    }
    await this.deviceModel.findByIdAndUpdate(device._id, { lastSeenAt: new Date(), status: 'online' });

    if (messageType === 'telemetry') {
      const record = await this.telemetryModel.create({
        deviceId:  device._id,
        timestamp: data.timestamp ? new Date(data.timestamp as string) : new Date(),
        metrics:   data.metrics ?? data,
      });

      // Push to WebSocket subscribers
      this.telemetryGateway.broadcastTelemetry(orgId, systemId, device._id.toString(), record.metrics as Record<string, number>);
    }

    if (messageType === 'status') {
      const newStatus = (data.status as string) ?? 'online';
      await this.deviceModel.findOneAndUpdate({ mqttClientId: deviceId }, { status: newStatus });
    }
  }

  publish(topic: string, payload: object) {
    this.client?.publish(topic, JSON.stringify(payload), { qos: 1 });
  }

  sendCommand(orgId: string, systemId: string, deviceMqttId: string, command: object) {
    const topic = `solartech/${orgId}/${systemId}/${deviceMqttId}/command`;
    this.publish(topic, command);
  }
}
