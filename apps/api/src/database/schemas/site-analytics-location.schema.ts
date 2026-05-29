import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SiteAnalyticsLocationDocument = SiteAnalyticsLocation & Document;

@Schema({ collection: 'site_analytics_locations' })
export class SiteAnalyticsLocation {
  @Prop({ required: true, index: true })
  country: string;

  @Prop({ default: '' })
  region: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: 0 })
  visits: number;
}

export const SiteAnalyticsLocationSchema = SchemaFactory.createForClass(SiteAnalyticsLocation);
SiteAnalyticsLocationSchema.index({ country: 1, region: 1, city: 1 }, { unique: true });
