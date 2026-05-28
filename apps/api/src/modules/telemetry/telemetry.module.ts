import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { TelemetryGateway } from './telemetry.gateway';
import { Telemetry, TelemetrySchema } from '../../database/schemas/telemetry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }]),
    JwtModule,
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryGateway],
  exports: [TelemetryService, TelemetryGateway],
})
export class TelemetryModule {}

