import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MqttService } from './mqtt.service';
import { IotController } from './iot.controller';
import { Device, DeviceSchema } from '../../database/schemas/device.schema';
import { Telemetry, TelemetrySchema } from '../../database/schemas/telemetry.schema';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Device.name,    schema: DeviceSchema },
      { name: Telemetry.name, schema: TelemetrySchema },
    ]),
    forwardRef(() => TelemetryModule),
  ],
  controllers: [IotController],
  providers: [MqttService],
  exports: [MqttService],
})
export class IotModule {}

