import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SolarSystem, SolarSystemDocument } from '../../database/schemas/solar-system.schema';
import { Telemetry, TelemetryDocument } from '../../database/schemas/telemetry.schema';

export type SmartCityScope = {
  platformWide: boolean;
  organizationId?: string;
};

const CO2_KG_PER_KWH_YEAR = 1460 * 0.7;

@Injectable()
export class SmartCityService {
  constructor(
    @InjectModel(SolarSystem.name) private systemModel: Model<SolarSystemDocument>,
    @InjectModel(Telemetry.name)   private telemetryModel: Model<TelemetryDocument>,
  ) {}

  private baseMatch(scope: SmartCityScope, province?: string): Record<string, unknown> {
    const match: Record<string, unknown> = { status: 'active' };
    if (!scope.platformWide && scope.organizationId) {
      match.organizationId = new Types.ObjectId(scope.organizationId);
    }
    if (province) match['location.province'] = province;
    return match;
  }

  async getCityOverview(province?: string, scope: SmartCityScope = { platformWide: true }) {
    const match = this.baseMatch(scope, province);

    const systems = await this.systemModel.find(match).lean();

    const totalInstallations = systems.length;
    const totalCapacityKw    = systems.reduce((s, sys) => s + sys.systemSizeKw, 0);
    const totalCo2SavedKg    = Math.round(totalCapacityKw * CO2_KG_PER_KWH_YEAR);
    const treesEquivalent    = Math.round(totalCo2SavedKg / 21.77);

    // Group by city/municipality
    const byCityMap = new Map<string, { count: number; capacityKw: number; coords: number[][] }>();
    for (const sys of systems) {
      const key = sys.location?.city ?? 'Unknown';
      const existing = byCityMap.get(key) ?? { count: 0, capacityKw: 0, coords: [] };
      existing.count++;
      existing.capacityKw += sys.systemSizeKw;
      if (sys.location?.latitude && sys.location?.longitude) {
        existing.coords.push([sys.location.longitude, sys.location.latitude]);
      }
      byCityMap.set(key, existing);
    }

    const byCity = [...byCityMap.entries()].map(([city, data]) => ({
      city,
      ...data,
      avgLat: data.coords.length ? data.coords.reduce((s, c) => s + c[1], 0) / data.coords.length : 0,
      avgLng: data.coords.length ? data.coords.reduce((s, c) => s + c[0], 0) / data.coords.length : 0,
    }));

    // GeoJSON for map
    const geoJson = {
      type: 'FeatureCollection',
      features: systems
        .filter((s) => s.location?.latitude && s.location?.longitude)
        .map((s) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [s.location.longitude, s.location.latitude],
          },
          properties: {
            id:         s._id.toString(),
            name:       s.name,
            systemKw:   s.systemSizeKw,
            status:     s.status,
            city:       s.location.city,
          },
        })),
    };

    return {
      totalInstallations,
      totalCapacityKw:  Math.round(totalCapacityKw),
      totalCo2SavedKg,
      treesEquivalent,
      byCity,
      geoJson,
    };
  }

  async getProvinceStats(scope: SmartCityScope = { platformWide: true }) {
    const match = this.baseMatch(scope);
    return this.systemModel.aggregate([
      { $match: { ...match, 'location.province': { $exists: true, $nin: [null, ''] } } },
      { $group: {
        _id:         '$location.province',
        count:       { $sum: 1 },
        capacityKw:  { $sum: '$systemSizeKw' },
        cities:      { $addToSet: '$location.city' },
      }},
      { $addFields: {
        co2TonsPerYear: {
          $round: [{ $divide: [{ $multiply: ['$capacityKw', 1022] }, 1000] }, 1],
        },
      }},
      { $sort: { capacityKw: -1 } },
    ]);
  }

  async getGridHeatmap(province?: string, scope: SmartCityScope = { platformWide: true }) {
    const match = this.baseMatch(scope, province);

    const systems = await this.systemModel.find(match, {
      'location.latitude': 1,
      'location.longitude': 1,
      systemSizeKw: 1,
    }).lean();

    return systems
      .filter((s) => s.location?.latitude)
      .map((s) => ({
        lat:    s.location.latitude,
        lng:    s.location.longitude,
        weight: s.systemSizeKw,
      }));
  }

  async getCitySummaryCards(scope: SmartCityScope = { platformWide: true }) {
    const match = this.baseMatch(scope);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [total, thisMonth] = await Promise.all([
      this.systemModel.countDocuments(match),
      this.systemModel.countDocuments({
        ...match,
        installedAt: { $gte: monthStart },
      }),
    ]);

    const capacityResult = await this.systemModel.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$systemSizeKw' } } },
    ]);

    const totalKw = capacityResult[0]?.total ?? 0;

    return {
      totalSystems:         total,
      newThisMonth:         thisMonth,
      totalCapacityKw:      Math.round(totalKw),
      estimatedAnnualMwh:   Math.round(totalKw * 1460 / 1000),
      co2AvoidedTonsPerYear: Math.round(totalKw * 1460 * 0.7 / 1000),
    };
  }

  async getAdvancedAnalytics(province?: string, scope: SmartCityScope = { platformWide: true }) {
    const match = this.baseMatch(scope, province);
    const systems = await this.systemModel.find(match).lean();
    const systemIds = systems.map((s) => s._id as Types.ObjectId);
    const since = new Date(Date.now() - 7 * 86400_000);

    const telemetry = await this.telemetryModel.aggregate([
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
          'device.solarSystemId': { $in: systemIds },
          timestamp: { $gte: since },
        },
      },
      {
        $project: {
          timestamp: 1,
          systemId: '$device.solarSystemId',
          powerOutputW: '$metrics.powerOutputW',
          gridPowerW: '$metrics.gridPowerW',
          loadPowerW: '$metrics.loadPowerW',
          energyTodayKwh: '$metrics.energyTodayKwh',
        },
      },
      { $sort: { timestamp: -1 } },
      { $limit: 10000 },
    ]);

    const systemById = new Map(systems.map((s) => [String(s._id), s]));
    const cityStats = new Map<string, { productionKwh: number; capacityKw: number; systems: number }>();
    const barangayStats = new Map<string, { demandKw: number; outages: number; systems: number }>();
    const facilityStats = new Map<string, { count: number; capacityKw: number; productionKwh: number }>();
    const evStats = { chargers: 0, sessionsEstimate: 0, energyKwh: 0 };

    for (const s of systems) {
      const city = s.location?.city ?? 'Unknown';
      const facilityType = this.facilityTypeOf(s);
      const barangay = this.barangayOf(s);
      const c = cityStats.get(city) ?? { productionKwh: 0, capacityKw: 0, systems: 0 };
      c.capacityKw += s.systemSizeKw ?? 0;
      c.systems += 1;
      cityStats.set(city, c);

      const f = facilityStats.get(facilityType) ?? { count: 0, capacityKw: 0, productionKwh: 0 };
      f.count += 1;
      f.capacityKw += s.systemSizeKw ?? 0;
      facilityStats.set(facilityType, f);

      const b = barangayStats.get(barangay) ?? { demandKw: 0, outages: 0, systems: 0 };
      b.systems += 1;
      barangayStats.set(barangay, b);

      if (String(s.name ?? '').toLowerCase().includes('ev')) {
        evStats.chargers += 1;
      }
    }

    const samplesBySystem = new Map<string, Array<{ t: Date; p: number; l: number; g: number }>>();
    for (const row of telemetry) {
      const sid = String(row.systemId);
      const arr = samplesBySystem.get(sid) ?? [];
      arr.push({
        t: new Date(row.timestamp),
        p: Number(row.powerOutputW ?? 0),
        l: Number(row.loadPowerW ?? 0),
        g: Number(row.gridPowerW ?? 0),
      });
      samplesBySystem.set(sid, arr);

      const system = systemById.get(sid);
      if (!system) continue;
      const city = system.location?.city ?? 'Unknown';
      const barangay = this.barangayOf(system);
      const facilityType = this.facilityTypeOf(system);

      const c = cityStats.get(city);
      if (c) c.productionKwh += Number(row.energyTodayKwh ?? 0);

      const b = barangayStats.get(barangay);
      if (b) b.demandKw += Number(row.loadPowerW ?? 0) / 1000;

      const f = facilityStats.get(facilityType);
      if (f) f.productionKwh += Number(row.energyTodayKwh ?? 0);

      if (facilityType === 'ev_charging') {
        evStats.energyKwh += Number(row.energyTodayKwh ?? 0);
      }
    }

    let outageEvents = 0;
    for (const [sid, rows] of samplesBySystem.entries()) {
      const sorted = rows.sort((a, b) => a.t.getTime() - b.t.getTime());
      let localOutages = 0;
      for (let i = 1; i < sorted.length; i++) {
        const diffMin = (sorted[i].t.getTime() - sorted[i - 1].t.getTime()) / 60000;
        if (diffMin > 180) localOutages += 1;
      }
      outageEvents += localOutages;
      const s = systemById.get(sid);
      if (s) {
        const barangay = this.barangayOf(s);
        const b = barangayStats.get(barangay);
        if (b) b.outages += localOutages;
      }
    }

    const renewableTotalKwh = [...cityStats.values()].reduce((sum, c) => sum + c.productionKwh, 0);
    const estimatedGridConsumptionKwh = telemetry.reduce((sum, r) => sum + Number(r.loadPowerW ?? 0) / 1000, 0);
    const gridUtilization = estimatedGridConsumptionKwh > 0
      ? Math.round((telemetry.reduce((sum, r) => sum + Number(r.gridPowerW ?? 0) / 1000, 0) / estimatedGridConsumptionKwh) * 100)
      : 0;

    const byBarangay = [...barangayStats.entries()].map(([name, v]) => ({
      name,
      avgDemandKw: Number((v.demandKw / Math.max(1, v.systems)).toFixed(2)),
      outageEvents: v.outages,
      systems: v.systems,
    })).sort((a, b) => b.systems - a.systems).slice(0, 15);

    const publicFacilities = [...facilityStats.entries()].map(([type, v]) => ({
      type,
      count: v.count,
      capacityKw: Math.round(v.capacityKw),
      productionKwh: Math.round(v.productionKwh),
    })).sort((a, b) => b.capacityKw - a.capacityKw);

    const renewableStats = {
      totalProductionKwh: Math.round(renewableTotalKwh),
      solarAdoptionRate: Math.min(100, Math.round((systems.length / Math.max(1, systems.length + 40)) * 100)),
      carbonAvoidedKg: Math.round(renewableTotalKwh * 0.7),
    };

    return {
      cityWideMonitoring: {
        systems: systems.length,
        totalCapacityKw: Math.round(systems.reduce((s, x) => s + x.systemSizeKw, 0)),
        monitoredCities: new Set(systems.map((s) => s.location?.city).filter(Boolean)).size,
      },
      byBarangay,
      publicFacilities,
      renewableStats,
      carbonAnalytics: {
        annualEquivalentTons: Number((renewableStats.carbonAvoidedKg / 1000).toFixed(2)),
        treesEquivalent: Math.round(renewableStats.carbonAvoidedKg / 21.77),
      },
      gridUtilization: {
        percentFromGrid: gridUtilization,
        estimatedDemandKwh: Math.round(estimatedGridConsumptionKwh),
      },
      outageTracking: {
        outageEvents,
        impactedBarangays: byBarangay.filter((b) => b.outageEvents > 0).length,
      },
      evChargingAnalytics: {
        chargingSites: evStats.chargers,
        sessionsEstimate: Math.max(evStats.sessionsEstimate, Math.round(evStats.energyKwh / 25)),
        energyKwh: Math.round(evStats.energyKwh),
      },
      targetSegments: ['LGUs', 'Smart cities', 'Utility companies'],
    };
  }

  private facilityTypeOf(system: Partial<SolarSystem>) {
    const name = String(system.name ?? '').toLowerCase();
    if (name.includes('school') || name.includes('city hall') || name.includes('municipal') || name.includes('hospital')) {
      return 'public_facility';
    }
    if (name.includes('ev')) return 'ev_charging';
    if (name.includes('mall') || name.includes('office') || name.includes('tower')) return 'commercial';
    return 'residential';
  }

  private barangayOf(system: Partial<SolarSystem>) {
    const raw = String(system.location?.address ?? '');
    const m = raw.match(/barangay\s+([a-z0-9\-\s]+)/i);
    if (m?.[1]) return `Brgy ${m[1].trim()}`;
    return `Brgy ${String(system.location?.city ?? 'Unknown')}`;
  }
}
