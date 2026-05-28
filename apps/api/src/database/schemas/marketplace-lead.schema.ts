import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MarketplaceLeadDocument = MarketplaceLead & Document;

@Schema({ timestamps: true, collection: 'marketplace_leads' })
export class MarketplaceLead {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Installer' })
  installerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  province?: string;

  @Prop({ type: Number })
  systemSizeKw?: number;

  @Prop({ type: Number })
  budgetMin?: number;

  @Prop({ type: Number })
  budgetMax?: number;

  @Prop({ type: String, enum: ['quotation', 'installation', 'maintenance', 'consultation'], default: 'quotation' })
  requestType: string;

  @Prop({
    type: String,
    enum: ['open', 'bidding', 'awarded', 'closed', 'cancelled'],
    default: 'open',
  })
  status: string;

  @Prop({ type: Date })
  preferredStartDate?: Date;

  @Prop({ default: 0 })
  bidCount: number;
}

export const MarketplaceLeadSchema = SchemaFactory.createForClass(MarketplaceLead);
MarketplaceLeadSchema.index({ status: 1, createdAt: -1 });
MarketplaceLeadSchema.index({ installerId: 1, status: 1 });
