import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MarketplaceBookingDocument = MarketplaceBooking & Document;

@Schema({ timestamps: true, collection: 'marketplace_bookings' })
export class MarketplaceBooking {
  @Prop({ type: Types.ObjectId, ref: 'MarketplaceLead', required: true })
  leadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MarketplaceBid' })
  bidId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Installer', required: true, index: true })
  installerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  scheduledDate: Date;

  @Prop({ type: Number, required: true })
  totalAmount: number;

  @Prop({
    type: String,
    enum: [
      'pending_deposit',
      'escrow_funded',
      'in_progress',
      'milestone_complete',
      'released',
      'disputed',
      'cancelled',
    ],
    default: 'pending_deposit',
  })
  escrowStatus: string;

  @Prop({ type: Number, default: 0 })
  escrowHeldAmount: number;

  @Prop({ type: Number, default: 0 })
  escrowReleasedAmount: number;

  @Prop()
  notes?: string;
}

export const MarketplaceBookingSchema = SchemaFactory.createForClass(MarketplaceBooking);
MarketplaceBookingSchema.index({ clientId: 1, createdAt: -1 });
MarketplaceBookingSchema.index({ installerId: 1, escrowStatus: 1 });
