import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmartCityController } from './smart-city.controller';
import { SmartCityService } from './smart-city.service';
import { SolarSystem, SolarSystemSchema } from '../../database/schemas/solar-system.schema';
import { Telemetry, TelemetrySchema }     from '../../database/schemas/telemetry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SolarSystem.name, schema: SolarSystemSchema },
      { name: Telemetry.name,   schema: TelemetrySchema },
    ]),
  ],
  controllers: [SmartCityController],
  providers: [SmartCityService],
  exports: [SmartCityService],
})
export class SmartCityModule {}

