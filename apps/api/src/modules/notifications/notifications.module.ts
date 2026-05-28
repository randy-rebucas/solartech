import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationSchema } from '../../database/schemas/notification.schema';
import {
  NotificationPreference,
  NotificationPreferenceSchema,
} from '../../database/schemas/notification-preference.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Notification.name, schema: NotificationSchema },
    { name: NotificationPreference.name, schema: NotificationPreferenceSchema },
  ])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

