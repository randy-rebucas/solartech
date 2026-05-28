import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuotationDocument = Quotation & Document;

@Schema({ timestamps: true, collection: 'quotations' })
export class Quotation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', index: true })
  organizationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: String, enum: ['draft','pending','approved','rejected','expired'], default: 'draft' })
  status: string;

  @Prop({ type: Object, required: true })
  input: {
    monthlyBill: number;
    monthlyKwh: number;
    roofArea: number;
    roofType: string;
    roofAzimuth?: number;
    latitude: number;
    longitude: number;
    peakSunHours?: number;
    gridType: string;
    includesBattery: boolean;
    currency: string;
    utilityRate: number;
    address: string;
    city: string;
    province: string;
  };

  @Prop({ type: Object })
  output?: {
    recommendedSystemSizeKw: number;
    numberOfPanels: number;
    panelWattage: number;
    inverterSizeKw: number;
    batteryCapacityKwh?: number;
    estimatedAnnualProductionKwh: number;
    estimatedMonthlySavings: number;
    estimatedAnnualSavings: number;
    systemCost: number;
    installationCost: number;
    totalCost: number;
    paybackPeriodYears: number;
    roi25Years: number;
    co2ReductionKgPerYear: number;
    netMeteringEligible: boolean;
    equipment: Array<{
      type: string;
      brand: string;
      model: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      specs: Record<string, string | number>;
    }>;
  };

  @Prop()
  proposalUrl?: string;

  @Prop()
  notes?: string;

  @Prop({ default: () => new Date(Date.now() + 30 * 24 * 3600 * 1000) })
  validUntil: Date;
}

export const QuotationSchema = SchemaFactory.createForClass(Quotation);
QuotationSchema.index({ clientId: 1, createdAt: -1 });
QuotationSchema.index({ organizationId: 1, status: 1 });
