import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationPreferenceDocument = NotificationPreference & Document;

@Schema({ timestamps: true, collection: 'notification_preferences' })
export class NotificationPreference {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      in_app: { type: Boolean, default: true },
    },
    _id: false,
    default: { email: true, sms: false, push: true, in_app: true },
  })
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
  };

  @Prop({
    type: {
      fault_alert: { type: Boolean, default: true },
      maintenance_reminder: { type: Boolean, default: true },
      billing_notification: { type: Boolean, default: true },
      proposal_approval: { type: Boolean, default: true },
      energy_anomaly: { type: Boolean, default: true },
    },
    _id: false,
    default: {
      fault_alert: true,
      maintenance_reminder: true,
      billing_notification: true,
      proposal_approval: true,
      energy_anomaly: true,
    },
  })
  events: {
    fault_alert: boolean;
    maintenance_reminder: boolean;
    billing_notification: boolean;
    proposal_approval: boolean;
    energy_anomaly: boolean;
  };
}

export const NotificationPreferenceSchema = SchemaFactory.createForClass(NotificationPreference);
