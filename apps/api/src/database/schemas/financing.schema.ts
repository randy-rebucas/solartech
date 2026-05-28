import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FinancingApplicationDocument = FinancingApplication & Document;

@Schema({ timestamps: true, collection: 'financing_applications' })
export class FinancingApplication {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Invoice' })
  invoiceId?: Types.ObjectId;

  @Prop({ required: true })
  referenceNo: string;

  @Prop({ required: true })
  provider: string; // bank api provider or in-house financing

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  termMonths: number;

  @Prop({ required: true, default: 0 })
  annualRate: number;

  @Prop({ type: String, enum: ['submitted', 'under_review', 'approved', 'rejected', 'disbursed'], default: 'submitted', index: true })
  status: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  disbursedAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop()
  notes?: string;
}

export const FinancingApplicationSchema = SchemaFactory.createForClass(FinancingApplication);
FinancingApplicationSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
