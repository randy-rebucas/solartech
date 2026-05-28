import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MaintenanceTicketDocument = MaintenanceTicket & Document;

@Schema({ timestamps: true, collection: 'maintenance_tickets' })
export class MaintenanceTicket {
  @Prop({ type: Types.ObjectId, ref: 'SolarSystem', required: true, index: true })
  solarSystemId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTechnicianId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true, index: true })
  workOrderNo: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: String,
    enum: ['open','assigned','in_progress','pending_parts','resolved','closed','cancelled'],
    default: 'open',
    index: true,
  })
  status: string;

  @Prop({ type: String, enum: ['critical','high','medium','low'], default: 'medium', index: true })
  priority: string;

  @Prop({ type: String, enum: ['corrective','preventive','inspection','warranty'] })
  type: string;

  @Prop({ default: [] })
  images: string[];

  @Prop({ type: Object })
  deviceFault?: { deviceId: string; errorCode: string; description: string };

  @Prop({ default: [] })
  workLog: Array<{
    technicianId: Types.ObjectId;
    action: string;
    notes?: string;
    timestamp: Date;
    images?: string[];
  }>;

  @Prop({ default: [] })
  parts: Array<{
    name: string;
    quantity: number;
    unitCost: number;
    status: 'needed' | 'ordered' | 'received' | 'installed';
  }>;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop({ type: Number })
  laborCost?: number;

  @Prop()
  resolution?: string;

  @Prop()
  slaDeadline?: Date;

  @Prop({ type: Object })
  dispatch?: {
    technicianId?: Types.ObjectId;
    eta?: Date;
    routeNote?: string;
    status?: 'queued' | 'dispatched' | 'arrived';
  };

  @Prop({ default: [] })
  reminders: Array<{
    title: string;
    remindAt: Date;
    sent: boolean;
  }>;

  @Prop({ default: [] })
  communications: Array<{
    channel: 'in_app' | 'sms' | 'email' | 'phone';
    message: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
  }>;

  @Prop({ type: Object })
  preventivePlan?: {
    enabled: boolean;
    intervalDays?: number;
    nextDueAt?: Date;
  };

  @Prop({ type: Object })
  assetLifecycle?: {
    stage?: 'new' | 'active' | 'aging' | 'critical' | 'retired';
    installDate?: Date;
    expectedEndOfLife?: Date;
    healthScore?: number;
  };
}

export const MaintenanceTicketSchema = SchemaFactory.createForClass(MaintenanceTicket);
MaintenanceTicketSchema.index({ organizationId: 1, status: 1, priority: 1 });
MaintenanceTicketSchema.index({ assignedTechnicianId: 1, status: 1 });
