import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MarketplaceMessageDocument = MarketplaceMessage & Document;

@Schema({ timestamps: true, collection: 'marketplace_messages' })
export class MarketplaceMessage {
  @Prop({ type: Types.ObjectId, ref: 'MarketplaceLead', required: true, index: true })
  leadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  body: string;

  @Prop({ default: false })
  read: boolean;
}

export const MarketplaceMessageSchema = SchemaFactory.createForClass(MarketplaceMessage);
MarketplaceMessageSchema.index({ leadId: 1, createdAt: 1 });
