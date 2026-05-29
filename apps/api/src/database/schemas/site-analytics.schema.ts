import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SiteAnalyticsDailyDocument = SiteAnalyticsDaily & Document;

@Schema({ collection: 'site_analytics_daily' })
export class SiteAnalyticsDaily {
  @Prop({ required: true, unique: true, index: true })
  date: string;

  @Prop({ default: 0 })
  visits: number;

  @Prop({ default: 0 })
  pageViews: number;

  @Prop({ default: 0 })
  clicks: number;
}

export const SiteAnalyticsDailySchema = SchemaFactory.createForClass(SiteAnalyticsDaily);
