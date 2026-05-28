import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SolarSystemDocument = SolarSystem & Document;

@Schema({ timestamps: true, collection: 'solar_systems' })
export class SolarSystem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Quotation' })
  quotationId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: ['planning','installing','active','maintenance','offline'],
    default: 'planning',
    index: true,
  })
  status: string;

  @Prop({ required: true })
  systemSizeKw: number;

  @Prop()
  installedAt?: Date;

  @Prop({
    type: {
      address:   String,
      city:      String,
      province:  String,
      country:   { type: String, default: 'PH' },
      latitude:  Number,
      longitude: Number,
    },
    _id: false,
  })
  location: {
    address: string;
    city: string;
    province: string;
    country: string;
    latitude: number;
    longitude: number;
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Device' }], default: [] })
  devices: Types.ObjectId[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const SolarSystemSchema = SchemaFactory.createForClass(SolarSystem);
SolarSystemSchema.index({ organizationId: 1, status: 1 });
SolarSystemSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
