import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TelemetryDocument = Telemetry & Document;

@Schema({ timeseries: { timeField: 'timestamp', metaField: 'deviceId', granularity: 'seconds' }, collection: 'telemetry' })
export class Telemetry {
  @Prop({ type: Types.ObjectId, ref: 'Device', required: true, index: true })
  deviceId: Types.ObjectId;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ type: Object, required: true })
  metrics: {
    powerOutputW?: number;
    voltageV?: number;
    currentA?: number;
    frequencyHz?: number;
    temperatureCelsius?: number;
    batteryLevelPercent?: number;
    batteryStateOfCharge?: number;
    energyTodayKwh?: number;
    energyTotalKwh?: number;
    gridPowerW?: number;
    loadPowerW?: number;
    irradianceWm2?: number;
    windSpeedMs?: number;
    [key: string]: number | undefined;
  };
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry);
TelemetrySchema.index({ deviceId: 1, timestamp: -1 });
