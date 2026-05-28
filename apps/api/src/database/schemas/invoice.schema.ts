import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true, collection: 'invoices' })
export class Invoice {
  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SolarSystem' })
  solarSystemId?: Types.ObjectId;

  @Prop({ type: String, enum: ['draft','sent','paid','overdue','cancelled'], default: 'draft', index: true })
  status: string;

  @Prop({ type: String, enum: ['one_time', 'subscription', 'installment'], default: 'one_time', index: true })
  billingType: string;

  @Prop({ required: true, type: Array })
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0.12 })
  taxRate: number;

  @Prop({ default: 0 })
  taxAmount: number;

  @Prop({ default: 0 })
  discountAmount: number;

  @Prop({ required: true })
  total: number;

  @Prop({ default: 'PHP' })
  currency: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop()
  paidAt?: Date;

  @Prop()
  paymentMethod?: string;

  @Prop()
  stripePaymentIntentId?: string;

  @Prop()
  notes?: string;

  @Prop()
  reminderSentAt?: Date;

  @Prop()
  nextReminderAt?: Date;

  @Prop({
    type: {
      planName: String,
      interval: { type: String, enum: ['monthly', 'quarterly', 'yearly'] },
      startDate: Date,
      nextBillingDate: Date,
      active: Boolean,
      gateway: String,
    },
    _id: false,
  })
  subscription?: {
    planName: string;
    interval: 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    nextBillingDate: Date;
    active: boolean;
    gateway?: string;
  };

  @Prop({
    type: {
      totalInstallments: Number,
      paidInstallments: Number,
      installmentAmount: Number,
      interestRate: Number,
      nextDueDate: Date,
      schedule: [{
        dueDate: Date,
        amount: Number,
        status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
      }],
    },
    _id: false,
  })
  installmentPlan?: {
    totalInstallments: number;
    paidInstallments: number;
    installmentAmount: number;
    interestRate: number;
    nextDueDate?: Date;
    schedule: Array<{ dueDate: Date; amount: number; status: string }>;
  };

  @Prop({
    type: {
      recipientUserId: { type: Types.ObjectId, ref: 'User' },
      rate: Number,
      amount: Number,
      status: { type: String, enum: ['pending', 'accrued', 'paid'], default: 'pending' },
      paidAt: Date,
    },
    _id: false,
  })
  commission?: {
    recipientUserId?: Types.ObjectId;
    rate: number;
    amount: number;
    status: string;
    paidAt?: Date;
  };
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ organizationId: 1, status: 1, dueDate: 1 });
