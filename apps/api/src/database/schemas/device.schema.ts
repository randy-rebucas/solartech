import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true, collection: 'devices' })
export class Device {
  @Prop({ type: Types.ObjectId, ref: 'SolarSystem', index: true })
  solarSystemId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: ['inverter','battery','smart_meter','weather_sensor','ev_charger','esp32','raspberry_pi'],
    required: true,
  })
  type: string;

  @Prop({ type: String, enum: ['online','offline','warning','error','maintenance'], default: 'offline' })
  status: string;

  @Prop({ required: true, unique: true })
  serialNumber: string;

  @Prop({ default: '1.0.0' })
  firmware: string;

  @Prop()
  macAddress?: string;

  @Prop()
  ipAddress?: string;

  @Prop({ required: true, unique: true, index: true })
  mqttClientId: string;

  @Prop({ select: false })
  deviceAuthTokenHash?: string;

  @Prop({
    type: { latitude: Number, longitude: Number },
    _id: false,
  })
  location?: { latitude: number; longitude: number };

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop()
  lastSeenAt?: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
DeviceSchema.index({ organizationId: 1, type: 1, status: 1 });
