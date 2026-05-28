import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Telemetry, TelemetryDocument } from '../../database/schemas/telemetry.schema';

@Injectable()
export class TelemetryService {
  constructor(@InjectModel(Telemetry.name) private model: Model<TelemetryDocument>) {}

  async getLatest(deviceId: string) {
    return this.model.findOne({ deviceId: new Types.ObjectId(deviceId) })
      .sort({ timestamp: -1 })
      .lean();
  }

  async getHistory(deviceId: string, from: Date, to: Date, resolution: 'raw' | '1h' | '1d' = '1h') {
    if (resolution === 'raw') {
      return this.model.find({
        deviceId: new Types.ObjectId(deviceId),
        timestamp: { $gte: from, $lte: to },
      }).sort({ timestamp: 1 }).limit(1440).lean();
    }

    const groupBy = resolution === '1h'
      ? { year: { $year: '$timestamp' }, month: { $month: '$timestamp' }, day: { $dayOfMonth: '$timestamp' }, hour: { $hour: '$timestamp' } }
      : { year: { $year: '$timestamp' }, month: { $month: '$timestamp' }, day: { $dayOfMonth: '$timestamp' } };

    return this.model.aggregate([
      { $match: { deviceId: new Types.ObjectId(deviceId), timestamp: { $gte: from, $lte: to } } },
      { $group: {
        _id: groupBy,
        avgPower:  { $avg: '$metrics.powerOutputW' },
        maxPower:  { $max: '$metrics.powerOutputW' },
        avgTemp:   { $avg: '$metrics.temperatureCelsius' },
        totalEnergy: { $max: '$metrics.energyTodayKwh' },
        timestamp: { $first: '$timestamp' },
      }},
      { $sort: { timestamp: 1 } },
    ]);
  }

  async getSystemSummary(systemId: string) {
    // Aggregate across all devices of a system
    return this.model.aggregate([
      {
        $lookup: {
          from: 'devices',
          localField: 'deviceId',
          foreignField: '_id',
          as: 'device',
        },
      },
      { $unwind: '$device' },
      { $match: { 'device.solarSystemId': new Types.ObjectId(systemId) } },
      { $sort: { timestamp: -1 } },
      { $group: {
        _id: '$deviceId',
        latestMetrics: { $first: '$metrics' },
        deviceName:    { $first: '$device.name' },
        deviceType:    { $first: '$device.type' },
      }},
    ]);
  }

  async getEnergyStats(organizationId: string, days = 30) {
    const from = new Date(Date.now() - days * 86400_000);
    return this.model.aggregate([
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
          timestamp: { $gte: from },
        },
      },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        totalEnergyKwh: { $sum: '$metrics.energyTodayKwh' },
        avgPowerW:      { $avg: '$metrics.powerOutputW' },
        peakPowerW:     { $max: '$metrics.powerOutputW' },
      }},
      { $sort: { _id: 1 } },
    ]);
  }
}
