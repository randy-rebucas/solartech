import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InstallerDocument = Installer & Document;

@Schema({ timestamps: true, collection: 'installers' })
export class Installer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId?: Types.ObjectId;

  @Prop({ required: true })
  businessName: string;

  @Prop()
  description?: string;

  @Prop({ default: [] })
  serviceAreas: string[];

  @Prop({ default: [] })
  certifications: Array<{
    name: string;
    issuedBy: string;
    issuedAt: Date;
    expiresAt?: Date;
    documentUrl?: string;
  }>;

  @Prop({ default: [] })
  portfolio: Array<{
    title: string;
    description?: string;
    systemSizeKw: number;
    completedAt: Date;
    images: string[];
    clientTestimonial?: string;
  }>;

  @Prop({ default: 0 })
  avgRating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  totalProjects: number;

  @Prop({ type: String, enum: ['pending','verified','suspended'], default: 'pending' })
  verificationStatus: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ type: Object, default: {} })
  availability: Record<string, boolean>;

  /** Day-level calendar: ISO date (YYYY-MM-DD) → available | busy | booked */
  @Prop({ type: [{ date: String, status: String }], default: [] })
  calendarSlots: Array<{ date: string; status: 'available' | 'busy' | 'booked' }>;

  @Prop({ default: [] })
  specializations: string[];

  @Prop({ type: Number })
  priceRangeMin?: number;

  @Prop({ type: Number })
  priceRangeMax?: number;
}

export const InstallerSchema = SchemaFactory.createForClass(Installer);
InstallerSchema.index({ serviceAreas: 1, verificationStatus: 1 });
InstallerSchema.index({ avgRating: -1, totalProjects: -1 });
