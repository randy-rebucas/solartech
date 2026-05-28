import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Telemetry, TelemetryDocument } from '../../database/schemas/telemetry.schema';
import { SolarSystem, SolarSystemDocument } from '../../database/schemas/solar-system.schema';
import { Invoice, InvoiceDocument } from '../../database/schemas/invoice.schema';
import { MaintenanceTicket, MaintenanceTicketDocument } from '../../database/schemas/maintenance.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { Organization, OrganizationDocument } from '../../database/schemas/organization.schema';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';
import { Device, DeviceDocument } from '../../database/schemas/device.schema';
import { MarketplaceLead, MarketplaceLeadDocument } from '../../database/schemas/marketplace-lead.schema';
import { MarketplaceBooking, MarketplaceBookingDocument } from '../../database/schemas/marketplace-booking.schema';
import { rangeToDates } from './analytics-range';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Telemetry.name)          private telemetryModel: Model<TelemetryDocument>,
    @InjectModel(SolarSystem.name)        private systemModel: Model<SolarSystemDocument>,
    @InjectModel(Invoice.name)            private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(MaintenanceTicket.name)  private ticketModel: Model<MaintenanceTicketDocument>,
    @InjectModel(User.name)               private userModel: Model<UserDocument>,
    @InjectModel(Organization.name)       private orgModel: Model<OrganizationDocument>,
    @InjectModel(Notification.name)       private notificationModel: Model<NotificationDocument>,
    @InjectModel(Device.name)             private deviceModel: Model<DeviceDocument>,
    @InjectModel(MarketplaceLead.name)    private marketplaceLeadModel: Model<MarketplaceLeadDocument>,
    @InjectModel(MarketplaceBooking.name) private marketplaceBookingModel: Model<MarketplaceBookingDocument>,
  ) {}

  private orgTelemetryMatch(organizationId: string, from: Date, to: Date) {
    return [
      {
        $lookup: {
          from: 'devices',
          localField: 'deviceId',
          foreignField: '_id',
          as: 'device',
        },
      },
      { $unwind: '$device' },
      {
        $match: {
          'device.organizationId': new Types.ObjectId(organizationId),
          'device.type': 'inverter',
          timestamp: { $gte: from, $lte: to },
        },
      },
    ];
  }

  async getOrgDashboard(organizationId: string) {
    const orgId = new Types.ObjectId(organizationId);

    const fromMonth = new Date();
    fromMonth.setMonth(fromMonth.getMonth() - 6);

    const [
      systemStats,
      revenueStats,
      maintenanceStats,
      monthlyProduction,
      latestTelemetry,
    ] = await Promise.all([
      this.systemModel.aggregate([
        { $match: { organizationId: orgId } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalKw: { $sum: '$systemSizeKw' },
        }},
      ]),
      this.invoiceModel.aggregate([
        { $match: { organizationId: orgId, status: 'paid' } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      this.ticketModel.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.telemetryModel.aggregate([
        ...this.orgTelemetryMatch(organizationId, fromMonth, new Date()),
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$timestamp' } },
            production: { $sum: '$metrics.energyTodayKwh' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 7 },
      ]),
      this.telemetryModel.aggregate([
        ...this.orgTelemetryMatch(organizationId, new Date(Date.now() - 86400_000), new Date()),
        { $sort: { timestamp: -1 } },
        { $limit: 1 },
        { $project: { metrics: 1, timestamp: 1 } },
      ]),
    ]);

    const totalSystems = systemStats.reduce((s, g) => s + g.count, 0);
    const activeSystems = systemStats.find((g) => g._id === 'active')?.count ?? 0;
    const totalKw = systemStats.reduce((s, g) => s + g.totalKw, 0);
    const latest = latestTelemetry[0]?.metrics;

    return {
      systems:    { total: totalSystems, active: activeSystems, totalKw },
      revenue:    revenueStats,
      maintenance: maintenanceStats,
      monthlyProduction,
      live: {
        powerOutputW: latest?.powerOutputW ?? 0,
        energyTodayKwh: latest?.energyTodayKwh ?? 0,
        batterySoc: latest?.batteryStateOfCharge ?? latest?.batteryLevelPercent,
      },
    };
  }

  async getTodayHourlyProfile(organizationId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    return this.telemetryModel.aggregate([
      ...this.orgTelemetryMatch(organizationId, start, end),
      {
        $group: {
          _id: { $hour: '$timestamp' },
          production: { $avg: '$metrics.powerOutputW' },
          consumption: { $avg: '$metrics.loadPowerW' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getHourlyProfile(organizationId: string, days = 7) {
    const { from, to } = rangeToDates(`${days}d`);

    return this.telemetryModel.aggregate([
      ...this.orgTelemetryMatch(organizationId, from, to),
      {
        $group: {
          _id: { $hour: '$timestamp' },
          power: { $avg: '$metrics.powerOutputW' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  summarizeEnergyReport(rows: Array<{ energyKwh?: number; peakPowerW?: number; avgPowerW?: number }>) {
    const totalKwh = rows.reduce((s, r) => s + (r.energyKwh ?? 0), 0);
    const peakKw = rows.reduce((max, r) => Math.max(max, (r.peakPowerW ?? 0) / 1000), 0);
    const avgPower = rows.length
      ? rows.reduce((s, r) => s + (r.avgPowerW ?? 0), 0) / rows.length
      : 0;
    const performanceRatio = totalKwh > 0 && avgPower > 0
      ? Math.min(99, Math.round((totalKwh / (rows.length * 24 * (avgPower / 1000))) * 100))
      : 0;

    return { totalKwh, peakKw, performanceRatio, daily: rows };
  }

  async getEnergyReport(organizationId: string, from: Date, to: Date) {
    const daily = await this.telemetryModel.aggregate([
      ...this.orgTelemetryMatch(organizationId, from, to),
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          energyKwh:  { $sum: '$metrics.energyTodayKwh' },
          avgPowerW:  { $avg: '$metrics.powerOutputW' },
          peakPowerW: { $max: '$metrics.powerOutputW' },
          systems:    { $addToSet: '$device.solarSystemId' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      ...this.summarizeEnergyReport(
        daily.map((d) => ({
          energyKwh: d.energyKwh,
          avgPowerW: d.avgPowerW,
          peakPowerW: d.peakPowerW,
        })),
      ),
      daily,
    };
  }

  async getCarbonReport(organizationId: string, days = 30) {
    const from = new Date(Date.now() - days * 86400_000);
    const energy = await this.telemetryModel.aggregate([
      ...this.orgTelemetryMatch(organizationId, from, new Date()),
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          energyKwh: { $sum: '$metrics.energyTodayKwh' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalKwh = energy.reduce((s: number, d: { energyKwh: number }) => s + (d.energyKwh ?? 0), 0);
    const co2SavedKg = Math.round(totalKwh * 0.7);
    const treesEquivalent = Math.round(co2SavedKg / 21.77);
    const carsEquivalent = parseFloat((co2SavedKg / 4600).toFixed(2));

    const monthlyMap = new Map<string, number>();
    for (const row of energy) {
      const month = new Date(row._id).toLocaleString('en-US', { month: 'short' });
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + Math.round((row.energyKwh ?? 0) * 0.7));
    }

    return {
      totalKwh: Math.round(totalKwh),
      totalKg: co2SavedKg,
      co2SavedKg,
      treesEquivalent,
      carsEquivalent,
      dailyBreakdown: energy,
      monthly: [...monthlyMap.entries()].map(([month, avoided]) => ({ month, avoided })),
    };
  }

  async getAdminDashboard() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const oneHourAgo = new Date(Date.now() - 3600_000);
    const oneDayAgo = new Date(Date.now() - 86400_000);

    const [
      totalUsers,
      totalOrgs,
      activeSystems,
      platformRevenue,
      pendingVerifications,
      openAlerts,
      userGrowth,
      revenueByPlan,
      recentActivity,
      deviceTotals,
      marketplaceStatus,
      marketplaceBookings,
      telemetryLastHour,
      orgsWithTelemetry,
      aiSignals,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.orgModel.countDocuments(),
      this.systemModel.countDocuments({ status: 'active' }),
      this.invoiceModel.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      this.userModel.countDocuments({ isActive: false }),
      this.ticketModel.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      this.userModel.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%b', date: '$createdAt' } },
            users: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.invoiceModel.aggregate([
        { $match: { status: 'paid' } },
        {
          $lookup: {
            from: 'organizations',
            localField: 'organizationId',
            foreignField: '_id',
            as: 'org',
          },
        },
        { $unwind: '$org' },
        {
          $group: {
            _id: '$org.plan',
            revenue: { $sum: '$total' },
          },
        },
      ]),
      this.notificationModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      this.deviceModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      this.marketplaceLeadModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      this.marketplaceBookingModel.aggregate([
        {
          $group: {
            _id: '$escrowStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]),
      this.telemetryModel.countDocuments({ timestamp: { $gte: oneHourAgo } }),
      this.telemetryModel.aggregate([
        {
          $lookup: {
            from: 'devices',
            localField: 'deviceId',
            foreignField: '_id',
            as: 'device',
          },
        },
        { $unwind: '$device' },
        { $match: { timestamp: { $gte: oneDayAgo } } },
        { $group: { _id: '$device.organizationId' } },
        { $count: 'count' },
      ]),
      this.notificationModel.aggregate([
        {
          $match: {
            event: { $regex: 'ai|anomaly|fault|prediction', $options: 'i' },
          },
        },
        {
          $group: {
            _id: '$event',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const deviceMap = Object.fromEntries(deviceTotals.map((d) => [d._id ?? 'unknown', d.count])) as Record<string, number>;
    const marketplaceMap = Object.fromEntries(marketplaceStatus.map((m) => [m._id ?? 'unknown', m.count])) as Record<string, number>;
    const bookingEscrowTotal = marketplaceBookings.reduce((sum, b) => sum + Number(b.totalAmount ?? 0), 0);
    const recentAuditLogs = recentActivity.slice(0, 8).map((n) => ({
      action: n.title,
      category: n.event,
      severity: n.event.includes('error') || n.event.includes('alert') ? 'high' : n.event.includes('warn') ? 'medium' : 'low',
      time: n.sentAt ?? new Date(),
    }));

    return {
      totalUsers,
      totalOrgs,
      activeSystems,
      revenue: platformRevenue[0]?.total ?? 0,
      pendingVerifications,
      openAlerts,
      userGrowth: userGrowth.map((g) => ({ month: g._id, users: g.users })),
      revenueByPlan: revenueByPlan.map((r) => ({
        plan: (r._id ?? 'starter').toString().replace(/^./, (c) => c.toUpperCase()),
        revenue: r.revenue,
      })),
      recentActivity: recentActivity.map((n) => ({
        type: n.event.includes('error') || n.event.includes('alert') ? 'error'
          : n.event.includes('warn') || n.event.includes('offline') ? 'warning'
          : 'success',
        message: n.title,
        time: n.sentAt ?? new Date(),
      })),
      deviceMonitoring: {
        total: Object.values(deviceMap).reduce((s, n) => s + n, 0),
        online: deviceMap.online ?? 0,
        warning: deviceMap.warning ?? 0,
        offline: (deviceMap.offline ?? 0) + (deviceMap.error ?? 0),
        maintenance: deviceMap.maintenance ?? 0,
      },
      marketplaceManagement: {
        openLeads: marketplaceMap.open ?? 0,
        biddingLeads: marketplaceMap.bidding ?? 0,
        awardedLeads: marketplaceMap.awarded ?? 0,
        bookings: marketplaceBookings.reduce((s, b) => s + Number(b.count ?? 0), 0),
        escrowValue: Math.round(bookingEscrowTotal),
      },
      aiInsights: {
        signalCounts: aiSignals.map((s) => ({ event: s._id ?? 'unknown', count: s.count })),
        topSignal: aiSignals[0]?._id ?? null,
      },
      auditLogs: recentAuditLogs,
      platformSettings: {
        maintenanceMode: false,
        aiAssistantEnabled: true,
        mqttEnabled: true,
        paymentGateways: ['stripe', 'paypal', 'paymongo', 'xendit', 'bank_api'],
        locale: 'en-PH',
      },
      realtimeMetrics: {
        telemetryPointsLastHour: telemetryLastHour,
        organizationsActiveLast24h: orgsWithTelemetry[0]?.count ?? 0,
        apiStatus: 'healthy',
      },
    };
  }

  async getInstallerPerformance(organizationId: string) {
    return this.systemModel.aggregate([
      { $match: { organizationId: new Types.ObjectId(organizationId) } },
      { $group: {
        _id: null,
        avgSystemSize:  { $avg: '$systemSizeKw' },
        totalInstalled: { $sum: 1 },
        byStatus: { $push: '$status' },
        totalCapacityKw: { $sum: '$systemSizeKw' },
      }},
    ]);
  }

  async getAiEnergyMonitoring(organizationId: string, days = 30) {
    const orgId = new Types.ObjectId(organizationId);
    const now = new Date();
    const from = new Date(Date.now() - days * 86400_000);

    const telemetryRows = await this.telemetryModel.aggregate([
      ...this.orgTelemetryMatch(organizationId, from, now),
      {
        $project: {
          timestamp: 1,
          powerOutputW: '$metrics.powerOutputW',
          loadPowerW: '$metrics.loadPowerW',
          temperatureCelsius: '$metrics.temperatureCelsius',
          irradianceWm2: '$metrics.irradianceWm2',
          energyTodayKwh: '$metrics.energyTodayKwh',
          frequencyHz: '$metrics.frequencyHz',
          deviceName: '$device.name',
        },
      },
      { $sort: { timestamp: -1 } },
      { $limit: 3000 },
    ]);

    const latest = telemetryRows[0] ?? {};
    const power = Number(latest.powerOutputW ?? 0);
    const load = Number(latest.loadPowerW ?? 0);
    const grid = Math.max(0, load - power);
    const battery = Math.max(0, power - load);

    // Consumption trend and peak demand
    const byHour = new Map<number, { sum: number; count: number }>();
    let peakDemandW = 0;
    for (const r of telemetryRows) {
      const l = Number(r.loadPowerW ?? 0);
      peakDemandW = Math.max(peakDemandW, l);
      const h = new Date(r.timestamp).getHours();
      const agg = byHour.get(h) ?? { sum: 0, count: 0 };
      agg.sum += l;
      agg.count += 1;
      byHour.set(h, agg);
    }
    const consumptionTrends = [...byHour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, a]) => ({
        hour,
        avgLoadW: Math.round(a.sum / Math.max(1, a.count)),
      }));

    const topPeak = consumptionTrends.reduce((max, p) => p.avgLoadW > max.avgLoadW ? p : max, { hour: 0, avgLoadW: 0 });

    // Abnormal conditions / inverter faults / consumption anomalies
    const anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      value?: number;
      threshold?: number;
      at?: Date;
    }> = [];

    const recent = telemetryRows.slice(0, 150);
    const tempAvg = recent.reduce((s, r) => s + Number(r.temperatureCelsius ?? 0), 0) / Math.max(1, recent.length);
    if (tempAvg > 68) {
      anomalies.push({
        type: 'inverter_fault_risk',
        severity: tempAvg > 75 ? 'critical' : 'high',
        message: `High inverter temperature trend (${tempAvg.toFixed(1)}°C avg).`,
        value: parseFloat(tempAvg.toFixed(1)),
        threshold: 68,
        at: latest.timestamp,
      });
    }

    const loadAvg = recent.reduce((s, r) => s + Number(r.loadPowerW ?? 0), 0) / Math.max(1, recent.length);
    const loadLatest = Number(latest.loadPowerW ?? 0);
    if (loadAvg > 0 && loadLatest > loadAvg * 1.45) {
      anomalies.push({
        type: 'abnormal_consumption',
        severity: loadLatest > loadAvg * 1.8 ? 'high' : 'medium',
        message: `Abnormal consumption spike: ${Math.round(loadLatest)}W vs ${Math.round(loadAvg)}W baseline.`,
        value: Math.round(loadLatest),
        threshold: Math.round(loadAvg * 1.45),
        at: latest.timestamp,
      });
    }

    const freq = Number(latest.frequencyHz ?? 60);
    if (freq < 59.3 || freq > 60.7) {
      anomalies.push({
        type: 'grid_frequency_fault',
        severity: 'high',
        message: `Grid frequency out-of-range: ${freq.toFixed(2)} Hz.`,
        value: parseFloat(freq.toFixed(2)),
        threshold: 60,
        at: latest.timestamp,
      });
    }

    // Weather correlation
    const weatherSamples = telemetryRows.filter((r) =>
      r.irradianceWm2 != null && r.powerOutputW != null,
    ).slice(0, 1200);
    const weatherCorrelation = this.simpleCorrelation(
      weatherSamples.map((r) => Number(r.irradianceWm2 ?? 0)),
      weatherSamples.map((r) => Number(r.powerOutputW ?? 0)),
    );

    // AI efficiency scoring
    const prodAvg = recent.reduce((s, r) => s + Number(r.powerOutputW ?? 0), 0) / Math.max(1, recent.length);
    const irradianceAvg = recent.reduce((s, r) => s + Number(r.irradianceWm2 ?? 0), 0) / Math.max(1, recent.length);
    const efficiencyRaw = irradianceAvg > 0 ? (prodAvg / irradianceAvg) * 100 : 0;
    const efficiencyScore = Math.max(0, Math.min(100, Math.round(efficiencyRaw)));

    // Prediction helpers
    const avgDailyEnergy = this.estimateDailyEnergyFromRows(telemetryRows);
    const predictedDailyConsumptionKwh = Math.round((loadAvg * 24) / 1000 * 10) / 10;
    const predictedMaintenanceRisk = Math.min(100, Math.round(
      (tempAvg > 68 ? 35 : 10) +
      (anomalies.length * 12) +
      (efficiencyScore < 65 ? 22 : 5),
    ));
    const forecastSavingsMonthlyPhp = Math.round(avgDailyEnergy * 30 * 10.5);

    const recommendations: string[] = [];
    if (topPeak.avgLoadW > 0) {
      recommendations.push(`Shift flexible loads away from ${topPeak.hour}:00 peak window.`);
    }
    if (efficiencyScore < 70) {
      recommendations.push('Schedule panel cleaning and inverter thermal inspection.');
    }
    if (weatherCorrelation < 0.45) {
      recommendations.push('Low weather-production correlation suggests sensor or inverter derating issues.');
    }
    if (anomalies.some((a) => a.type === 'abnormal_consumption')) {
      recommendations.push('Audit high-load appliances and enable demand-limiting automation.');
    }
    if (!recommendations.length) {
      recommendations.push('System performance is stable. Continue routine preventive maintenance.');
    }

    const savingsTracker = await this.getSavingsAndCarbonTracker(orgId, from, now);

    return {
      liveEnergyFlow: {
        solarProductionW: Math.round(power),
        loadDemandW: Math.round(load),
        gridImportW: Math.round(grid),
        batteryChargeW: Math.round(battery),
        updatedAt: latest.timestamp ?? now,
      },
      anomalies,
      inverterFaultsDetected: anomalies.filter((a) => a.type.includes('fault')).length,
      abnormalConsumptionDetected: anomalies.some((a) => a.type === 'abnormal_consumption'),
      consumptionPrediction: {
        next24hKwh: predictedDailyConsumptionKwh,
        hourlyTrend: consumptionTrends,
      },
      peakDemandAnalysis: {
        peakDemandW: Math.round(peakDemandW),
        peakHour: topPeak.hour,
      },
      smartRecommendations: recommendations,
      efficiencyScoring: {
        score: efficiencyScore,
        grade: efficiencyScore >= 90 ? 'A' : efficiencyScore >= 80 ? 'B' : efficiencyScore >= 70 ? 'C' : efficiencyScore >= 60 ? 'D' : 'F',
      },
      weatherCorrelation: {
        coefficient: parseFloat(weatherCorrelation.toFixed(3)),
        summary: weatherCorrelation >= 0.7
          ? 'Strong weather-production correlation.'
          : weatherCorrelation >= 0.4
            ? 'Moderate weather-production correlation.'
            : 'Weak correlation; investigate sensors or hardware.',
      },
      maintenancePrediction: {
        riskScore: predictedMaintenanceRisk,
        level: predictedMaintenanceRisk >= 75 ? 'high' : predictedMaintenanceRisk >= 45 ? 'medium' : 'low',
      },
      forecastSavings: {
        next30DaysPhp: forecastSavingsMonthlyPhp,
        basedOnDailyKwh: avgDailyEnergy,
      },
      dashboardTrackers: savingsTracker,
    };
  }

  private estimateDailyEnergyFromRows(rows: Array<{ energyTodayKwh?: number; timestamp?: Date }>) {
    const byDay = new Map<string, number>();
    for (const r of rows) {
      if (!r.timestamp) continue;
      const key = new Date(r.timestamp).toISOString().slice(0, 10);
      byDay.set(key, Math.max(byDay.get(key) ?? 0, Number(r.energyTodayKwh ?? 0)));
    }
    const vals = [...byDay.values()].filter((v) => v > 0);
    if (!vals.length) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }

  private simpleCorrelation(xs: number[], ys: number[]) {
    const n = Math.min(xs.length, ys.length);
    if (n < 3) return 0;
    const x = xs.slice(0, n);
    const y = ys.slice(0, n);
    const mx = x.reduce((a, b) => a + b, 0) / n;
    const my = y.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < n; i++) {
      const a = x[i] - mx;
      const b = y[i] - my;
      num += a * b;
      dx += a * a;
      dy += b * b;
    }
    if (!dx || !dy) return 0;
    return num / Math.sqrt(dx * dy);
  }

  async getClientEnergyMonitoring(
    deviceIds: Types.ObjectId[],
    _organizationId: string,
    days = 30,
  ) {
    if (!deviceIds.length) return null;

    const now = new Date();
    const from = new Date(Date.now() - days * 86400_000);

    const telemetryRows = await this.telemetryModel.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          timestamp: { $gte: from, $lte: now },
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
      {
        $project: {
          timestamp: 1,
          powerOutputW: '$metrics.powerOutputW',
          loadPowerW: '$metrics.loadPowerW',
          temperatureCelsius: '$metrics.temperatureCelsius',
          irradianceWm2: '$metrics.irradianceWm2',
          energyTodayKwh: '$metrics.energyTodayKwh',
          frequencyHz: '$metrics.frequencyHz',
          deviceName: '$device.name',
        },
      },
      { $sort: { timestamp: -1 } },
      { $limit: 3000 },
    ]);

    const latest = telemetryRows[0] ?? {};
    const power = Number(latest.powerOutputW ?? 0);
    const load = Number(latest.loadPowerW ?? 0);
    const grid = Math.max(0, load - power);
    const battery = Math.max(0, power - load);

    const byHour = new Map<number, { sum: number; count: number }>();
    let peakDemandW = 0;
    for (const r of telemetryRows) {
      const l = Number(r.loadPowerW ?? 0);
      peakDemandW = Math.max(peakDemandW, l);
      const h = new Date(r.timestamp).getHours();
      const agg = byHour.get(h) ?? { sum: 0, count: 0 };
      agg.sum += l;
      agg.count += 1;
      byHour.set(h, agg);
    }
    const consumptionTrends = [...byHour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, a]) => ({
        hour,
        avgLoadW: Math.round(a.sum / Math.max(1, a.count)),
      }));

    const topPeak = consumptionTrends.reduce(
      (max, p) => (p.avgLoadW > max.avgLoadW ? p : max),
      { hour: 0, avgLoadW: 0 },
    );

    const anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      value?: number;
      threshold?: number;
      at?: Date;
    }> = [];

    const recent = telemetryRows.slice(0, 150);
    const tempAvg = recent.reduce((s, r) => s + Number(r.temperatureCelsius ?? 0), 0) / Math.max(1, recent.length);
    if (tempAvg > 68) {
      anomalies.push({
        type: 'inverter_fault_risk',
        severity: tempAvg > 75 ? 'critical' : 'high',
        message: `High inverter temperature trend (${tempAvg.toFixed(1)}°C avg).`,
        value: parseFloat(tempAvg.toFixed(1)),
        threshold: 68,
        at: latest.timestamp,
      });
    }

    const loadAvg = recent.reduce((s, r) => s + Number(r.loadPowerW ?? 0), 0) / Math.max(1, recent.length);
    const loadLatest = Number(latest.loadPowerW ?? 0);
    if (loadAvg > 0 && loadLatest > loadAvg * 1.45) {
      anomalies.push({
        type: 'abnormal_consumption',
        severity: loadLatest > loadAvg * 1.8 ? 'high' : 'medium',
        message: `Abnormal consumption spike: ${Math.round(loadLatest)}W vs ${Math.round(loadAvg)}W baseline.`,
        value: Math.round(loadLatest),
        threshold: Math.round(loadAvg * 1.45),
        at: latest.timestamp,
      });
    }

    const freq = Number(latest.frequencyHz ?? 60);
    if (freq < 59.3 || freq > 60.7) {
      anomalies.push({
        type: 'grid_frequency_fault',
        severity: 'high',
        message: `Grid frequency out-of-range: ${freq.toFixed(2)} Hz.`,
        value: parseFloat(freq.toFixed(2)),
        threshold: 60,
        at: latest.timestamp,
      });
    }

    const weatherSamples = telemetryRows
      .filter((r) => r.irradianceWm2 != null && r.powerOutputW != null)
      .slice(0, 1200);
    const weatherCorrelation = this.simpleCorrelation(
      weatherSamples.map((r) => Number(r.irradianceWm2 ?? 0)),
      weatherSamples.map((r) => Number(r.powerOutputW ?? 0)),
    );

    const prodAvg = recent.reduce((s, r) => s + Number(r.powerOutputW ?? 0), 0) / Math.max(1, recent.length);
    const irradianceAvg = recent.reduce((s, r) => s + Number(r.irradianceWm2 ?? 0), 0) / Math.max(1, recent.length);
    const efficiencyRaw = irradianceAvg > 0 ? (prodAvg / irradianceAvg) * 100 : 0;
    const efficiencyScore = Math.max(0, Math.min(100, Math.round(efficiencyRaw)));

    const avgDailyEnergy = this.estimateDailyEnergyFromRows(telemetryRows);
    const predictedDailyConsumptionKwh = Math.round((loadAvg * 24) / 1000 * 10) / 10;
    const predictedMaintenanceRisk = Math.min(
      100,
      Math.round((tempAvg > 68 ? 35 : 10) + anomalies.length * 12 + (efficiencyScore < 65 ? 22 : 5)),
    );
    const forecastSavingsMonthlyPhp = Math.round(avgDailyEnergy * 30 * 10.5);

    const recommendations: string[] = [];
    if (topPeak.avgLoadW > 0) {
      recommendations.push(`Shift flexible loads away from ${topPeak.hour}:00 peak window.`);
    }
    if (efficiencyScore < 70) {
      recommendations.push('Schedule panel cleaning and inverter thermal inspection.');
    }
    if (weatherCorrelation < 0.45) {
      recommendations.push('Low weather-production correlation suggests sensor or inverter derating issues.');
    }
    if (anomalies.some((a) => a.type === 'abnormal_consumption')) {
      recommendations.push('Audit high-load appliances and enable demand-limiting automation.');
    }
    if (!recommendations.length) {
      recommendations.push('System performance is stable. Continue routine preventive maintenance.');
    }

    const savingsTracker = await this.getSavingsForDevices(deviceIds, from, now);

    return {
      liveEnergyFlow: {
        solarProductionW: Math.round(power),
        loadDemandW: Math.round(load),
        gridImportW: Math.round(grid),
        batteryChargeW: Math.round(battery),
        updatedAt: latest.timestamp ?? now,
      },
      anomalies,
      inverterFaultsDetected: anomalies.filter((a) => a.type.includes('fault')).length,
      abnormalConsumptionDetected: anomalies.some((a) => a.type === 'abnormal_consumption'),
      consumptionPrediction: {
        next24hKwh: predictedDailyConsumptionKwh,
        hourlyTrend: consumptionTrends,
      },
      peakDemandAnalysis: {
        peakDemandW: Math.round(peakDemandW),
        peakHour: topPeak.hour,
      },
      smartRecommendations: recommendations,
      efficiencyScoring: {
        score: efficiencyScore,
        grade:
          efficiencyScore >= 90 ? 'A' : efficiencyScore >= 80 ? 'B' : efficiencyScore >= 70 ? 'C' : efficiencyScore >= 60 ? 'D' : 'F',
      },
      weatherCorrelation: {
        coefficient: parseFloat(weatherCorrelation.toFixed(3)),
        summary:
          weatherCorrelation >= 0.7
            ? 'Strong weather-production correlation.'
            : weatherCorrelation >= 0.4
              ? 'Moderate weather-production correlation.'
              : 'Weak correlation; investigate sensors or hardware.',
      },
      maintenancePrediction: {
        riskScore: predictedMaintenanceRisk,
        level: predictedMaintenanceRisk >= 75 ? 'high' : predictedMaintenanceRisk >= 45 ? 'medium' : 'low',
      },
      forecastSavings: {
        next30DaysPhp: forecastSavingsMonthlyPhp,
        basedOnDailyKwh: avgDailyEnergy,
      },
      dashboardTrackers: savingsTracker,
    };
  }

  private async getSavingsForDevices(deviceIds: Types.ObjectId[], from: Date, to: Date) {
    const rows = await this.telemetryModel.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          timestamp: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          energyKwh: { $sum: '$metrics.energyTodayKwh' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const totalKwh = rows.reduce((s, r) => s + Number(r.energyKwh ?? 0), 0);
    const savingsPhp = Math.round(totalKwh * 10.5);
    const carbonKg = Math.round(totalKwh * 0.7);
    return {
      savingsTracker: {
        totalKwh: Math.round(totalKwh),
        estimatedPhp: savingsPhp,
      },
      carbonReductionTracker: {
        totalKg: carbonKg,
        treesEquivalent: Math.round(carbonKg / 21.77),
      },
    };
  }

  private async getSavingsAndCarbonTracker(orgId: Types.ObjectId, from: Date, to: Date) {
    const rows = await this.telemetryModel.aggregate([
      {
        $lookup: {
          from: 'devices',
          localField: 'deviceId',
          foreignField: '_id',
          as: 'device',
        },
      },
      { $unwind: '$device' },
      {
        $match: {
          'device.organizationId': orgId,
          'device.type': 'inverter',
          timestamp: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          energyKwh: { $sum: '$metrics.energyTodayKwh' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const totalKwh = rows.reduce((s, r) => s + Number(r.energyKwh ?? 0), 0);
    const savingsPhp = Math.round(totalKwh * 10.5);
    const carbonKg = Math.round(totalKwh * 0.7);
    return {
      savingsTracker: {
        totalKwh: Math.round(totalKwh),
        estimatedPhp: savingsPhp,
      },
      carbonReductionTracker: {
        totalKg: carbonKg,
        treesEquivalent: Math.round(carbonKg / 21.77),
      },
    };
  }
}
