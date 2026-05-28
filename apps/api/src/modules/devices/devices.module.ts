import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { Device, DeviceSchema } from '../../database/schemas/device.schema';
import { Telemetry, TelemetrySchema } from '../../database/schemas/telemetry.schema';
import { Notification, NotificationSchema } from '../../database/schemas/notification.schema';
import { IotModule } from '../iot/iot.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Device.name, schema: DeviceSchema },
      { name: Telemetry.name, schema: TelemetrySchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    IotModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}

