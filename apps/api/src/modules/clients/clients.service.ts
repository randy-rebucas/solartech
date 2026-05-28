import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { JwtPayload } from '@solartech/shared';
import { SolarSystem, SolarSystemDocument } from '../../database/schemas/solar-system.schema';
import { Device, DeviceDocument } from '../../database/schemas/device.schema';
import { Telemetry, TelemetryDocument } from '../../database/schemas/telemetry.schema';
import { Invoice, InvoiceDocument } from '../../database/schemas/invoice.schema';
import { MaintenanceTicket, MaintenanceTicketDocument } from '../../database/schemas/maintenance.schema';
import { Quotation, QuotationDocument } from '../../database/schemas/quotation.schema';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { AnalyticsService } from '../analytics/analytics.service';

const PHP_PER_KWH = 10.5;
const CO2_KG_PER_KWH = 0.7;

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(SolarSystem.name) private systemModel: Model<SolarSystemDocument>,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(Telemetry.name) private telemetryModel: Model<TelemetryDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(MaintenanceTicket.name) private ticketModel: Model<MaintenanceTicketDocument>,
    @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private analyticsService: AnalyticsService,
  ) {}

  private deviceTelemetryStages(deviceIds: Types.ObjectId[], from: Date, to: Date) {
    return [
      {
        $match: {
          deviceId: { $in: deviceIds },
          timestamp: { $gte: from, $lte: to },
        },
      },
      {
        $lookup: {
          from: 'devices',
          localField: 'deviceId',
          foreignField: '_id',
          as: 'device',
        },
      },
      { $unwind: '$device' },
      { $match: { 'device.type': 'inverter' } },
    ];
  }

  async getDashboard(user: JwtPayload) {
    const clientId = new Types.ObjectId(user.sub);
    const systems = await this.systemModel
      .find({ clientId })
      .select('name systemSizeKw status location installedAt')
      .sort({ installedAt: -1 })
      .lean();

    const systemIds = systems.map((s) => s._id as Types.ObjectId);
    const devices = systemIds.length
      ? await this.deviceModel.find({ solarSystemId: { $in: systemIds } }).lean()
      : [];
    const deviceIds = devices.map((d) => d._id as Types.ObjectId);
    const primaryInverter = devices.find((d) => d.type === 'inverter') ?? devices[0];
    const primarySystem = systems[0];

    const now = new Date();
    const from30 = new Date(Date.now() - 30 * 86400_000);
    const from6mo = new Date();
    from6mo.setMonth(from6mo.getMonth() - 6);

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const profileUser = await this.userModel
      .findById(clientId)
      .select('firstName lastName email')
      .lean();

    const [
      latestTelemetry,
      todayHourly,
      monthlyRows,
      invoices,
      tickets,
      quotations,
      notifications,
      unreadCount,
    ] = await Promise.all([
      deviceIds.length
        ? this.telemetryModel
            .findOne({ deviceId: { $in: deviceIds } })
            .sort({ timestamp: -1 })
            .lean()
        : null,
      deviceIds.length
        ? this.telemetryModel.aggregate([
            ...this.deviceTelemetryStages(deviceIds, startToday, now),
            {
              $group: {
                _id: { $hour: '$timestamp' },
                production: { $avg: '$metrics.powerOutputW' },
                consumption: { $avg: '$metrics.loadPowerW' },
              },
            },
            { $sort: { _id: 1 } },
          ])
        : [],
      deviceIds.length
        ? this.telemetryModel.aggregate([
            ...this.deviceTelemetryStages(deviceIds, from6mo, now),
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$timestamp' } },
                productionKwh: { $sum: '$metrics.energyTodayKwh' },
                consumptionKwh: { $sum: '$metrics.loadPowerW' },
                avgLoadW: { $avg: '$metrics.loadPowerW' },
              },
            },
            { $sort: { _id: 1 } },
          ])
        : [],
      this.invoiceModel
        .find({ clientId })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('invoiceNumber status total dueDate paidAt createdAt')
        .lean(),
      this.ticketModel
        .find({ clientId })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('workOrderNo title status priority type scheduledAt createdAt')
        .lean(),
      this.quotationModel
        .find({ clientId })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('status input output createdAt updatedAt')
        .lean(),
      this.notificationModel
        .find({ userId: clientId })
        .sort({ sentAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      this.notificationModel.countDocuments({ userId: clientId, isRead: false }),
    ]);

    const metrics = latestTelemetry?.metrics ?? {};
    const solarW = Number(metrics.powerOutputW ?? 0);
    const loadW = Number(metrics.loadPowerW ?? 0);
    const batterySoc = Number(
      metrics.batteryStateOfCharge ?? metrics.batteryLevelPercent ?? 0,
    );

    const openInvoiceStatuses = ['sent', 'overdue', 'draft'];
    const openInvoices = invoices.filter((i) => openInvoiceStatuses.includes(i.status));
    const totalDue = openInvoices.reduce((s, i) => s + (i.total ?? 0), 0);

    const openTicketStatuses = ['open', 'assigned', 'in_progress', 'pending_parts'];
    const openTickets = tickets.filter((t) => openTicketStatuses.includes(t.status));

    const monthlyReports = monthlyRows.map((row: {
      _id: string;
      productionKwh?: number;
      consumptionKwh?: number;
      avgLoadW?: number;
    }) => {
      const productionKwh = Math.round((row.productionKwh ?? 0) * 10) / 10;
      const consumptionKwh = Math.round(((row.avgLoadW ?? 0) * 24 * 30) / 1000 * 10) / 10;
      return {
        month: row._id,
        label: this.formatMonthLabel(row._id),
        productionKwh,
        consumptionKwh,
        savingsPhp: Math.round(productionKwh * PHP_PER_KWH),
        co2Kg: Math.round(productionKwh * CO2_KG_PER_KWH),
      };
    });

    const aiMonitoring = deviceIds.length && user.organizationId
      ? await this.analyticsService.getClientEnergyMonitoring(
          deviceIds,
          user.organizationId,
          30,
        )
      : null;

    const documents = this.buildDocuments(systems, quotations, invoices);

    return {
      profile: {
        firstName: profileUser?.firstName,
        lastName: profileUser?.lastName,
        email: profileUser?.email,
      },
      primarySystem: primarySystem
        ? {
            id: String(primarySystem._id),
            name: primarySystem.name,
            systemSizeKw: primarySystem.systemSizeKw,
            status: primarySystem.status,
            city: (primarySystem as { location?: { city?: string } }).location?.city,
          }
        : null,
      systems: systems.map((s) => ({
        id: String(s._id),
        name: s.name,
        systemSizeKw: s.systemSizeKw,
        status: s.status,
      })),
      live: {
        solarProductionW: solarW,
        loadDemandW: loadW,
        gridImportW: Math.max(0, loadW - solarW),
        batteryChargeW: Math.max(0, solarW - loadW),
        energyTodayKwh: Number(metrics.energyTodayKwh ?? 0),
        batterySoc: batterySoc || null,
        updatedAt: latestTelemetry?.timestamp ?? now,
        deviceName: primaryInverter?.name,
      },
      todayHourly: todayHourly.map((h: { _id: number; production?: number; consumption?: number }) => ({
        hour: h._id,
        productionW: Math.round(h.production ?? 0),
        consumptionW: Math.round(h.consumption ?? 0),
      })),
      battery: {
        stateOfCharge: batterySoc || null,
        status: batterySoc >= 80 ? 'full' : batterySoc >= 40 ? 'normal' : batterySoc > 0 ? 'low' : 'unknown',
        charging: solarW > loadW,
      },
      billing: {
        openCount: openInvoices.length,
        totalDue,
        recent: invoices.map((i) => ({
          id: String(i._id),
          invoiceNumber: i.invoiceNumber,
          status: i.status,
          total: i.total,
          dueDate: i.dueDate,
          paidAt: i.paidAt,
        })),
      },
      maintenance: {
        openCount: openTickets.length,
        recent: tickets.map((t) => ({
          id: String(t._id),
          workOrderNo: t.workOrderNo,
          title: t.title,
          status: t.status,
          priority: t.priority,
          type: t.type,
          scheduledAt: t.scheduledAt,
        })),
      },
      proposals: quotations.map((q) => ({
        id: String(q._id),
        status: q.status,
        systemSizeKw: (q.output as { recommendedSystemSizeKw?: number })?.recommendedSystemSizeKw,
        totalCost: (q.output as { totalCost?: number })?.totalCost,
        monthlyBill: (q.input as { monthlyBill?: number })?.monthlyBill,
        createdAt: (q as { createdAt?: Date }).createdAt,
        updatedAt: (q as { updatedAt?: Date }).updatedAt,
      })),
      documents,
      notifications: {
        unreadCount,
        recent: notifications.map((n) => ({
          id: String(n._id),
          title: n.title,
          body: n.body,
          event: n.event,
          read: n.isRead,
          createdAt: n.sentAt ?? (n as { createdAt?: Date }).createdAt,
        })),
      },
      monthlyReports,
      aiRecommendations: aiMonitoring?.smartRecommendations ?? [
        'Connect your inverter to see personalized AI recommendations.',
      ],
      aiSummary: aiMonitoring
        ? {
            efficiencyScore: aiMonitoring.efficiencyScoring.score,
            efficiencyGrade: aiMonitoring.efficiencyScoring.grade,
            next24hConsumptionKwh: aiMonitoring.consumptionPrediction.next24hKwh,
            maintenanceRisk: aiMonitoring.maintenancePrediction,
            forecastSavingsPhp: aiMonitoring.forecastSavings.next30DaysPhp,
          }
        : null,
      trackers: aiMonitoring?.dashboardTrackers ?? {
        savingsTracker: {
          totalKwh: Math.round(monthlyReports.reduce((s, m) => s + m.productionKwh, 0)),
          estimatedPhp: Math.round(
            monthlyReports.reduce((s, m) => s + m.savingsPhp, 0),
          ),
        },
        carbonReductionTracker: {
          totalKg: monthlyReports.reduce((s, m) => s + m.co2Kg, 0),
          treesEquivalent: Math.max(
            0,
            Math.round(monthlyReports.reduce((s, m) => s + m.co2Kg, 0) / 21.77),
          ),
        },
      },
      peakDemand: aiMonitoring?.peakDemandAnalysis ?? null,
    };
  }

  private formatMonthLabel(ym: string) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString('en-PH', {
      month: 'short',
      year: 'numeric',
    });
  }

  private buildDocuments(
    systems: Array<{ _id: unknown; name: string }>,
    quotations: Array<{ _id: unknown; status: string; createdAt?: Date }>,
    invoices: Array<{ _id: unknown; invoiceNumber: string; status: string; createdAt?: Date }>,
  ) {
    const docs: Array<{
      id: string;
      title: string;
      type: string;
      createdAt?: Date;
      href: string;
    }> = [];

    for (const q of quotations) {
      docs.push({
        id: `proposal-${String(q._id)}`,
        title: `Solar proposal (${q.status})`,
        type: 'proposal',
        createdAt: q.createdAt,
        href: `/quotations/${String(q._id)}`,
      });
    }

    for (const inv of invoices) {
      docs.push({
        id: `invoice-${String(inv._id)}`,
        title: inv.invoiceNumber,
        type: 'invoice',
        createdAt: inv.createdAt,
        href: '/billing',
      });
    }

    for (const s of systems) {
      docs.push({
        id: `warranty-${String(s._id)}`,
        title: `${s.name} — installation warranty`,
        type: 'warranty',
        href: `/systems/${String(s._id)}`,
      });
      docs.push({
        id: `net-meter-${String(s._id)}`,
        title: `${s.name} — net metering certificate`,
        type: 'net_metering',
        href: `/systems/${String(s._id)}`,
      });
    }

    docs.push({
      id: 'manual-homeowner',
      title: 'Homeowner operations manual',
      type: 'manual',
      href: '/knowledge',
    });

    return docs
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 12)
      .map(({ createdAt, ...rest }) => ({
        ...rest,
        createdAt: createdAt?.toISOString(),
      }));
  }
}
