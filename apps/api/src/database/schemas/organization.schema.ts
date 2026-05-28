import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true, collection: 'organizations' })
export class Organization {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  logoUrl?: string;

  @Prop({ type: String, enum: ['starter','professional','enterprise'], default: 'starter' })
  plan: 'starter' | 'professional' | 'enterprise';

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  website?: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  province?: string;

  @Prop({ default: 'PH' })
  country: string;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  stripeSubscriptionId?: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
