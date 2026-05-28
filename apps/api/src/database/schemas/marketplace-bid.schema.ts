import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MarketplaceBidDocument = MarketplaceBid & Document;

@Schema({ timestamps: true, collection: 'marketplace_bids' })
export class MarketplaceBid {
  @Prop({ type: Types.ObjectId, ref: 'MarketplaceLead', required: true, index: true })
  leadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Installer', required: true, index: true })
  installerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop()
  proposalText?: string;

  @Prop({ type: Number })
  estimatedDurationDays?: number;

  @Prop({
    type: String,
    enum: ['submitted', 'accepted', 'rejected', 'withdrawn'],
    default: 'submitted',
  })
  status: string;
}

export const MarketplaceBidSchema = SchemaFactory.createForClass(MarketplaceBid);
MarketplaceBidSchema.index({ leadId: 1, installerId: 1 }, { unique: true });
