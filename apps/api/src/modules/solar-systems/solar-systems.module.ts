import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SolarSystemsController } from './solar-systems.controller';
import { SolarSystemsService } from './solar-systems.service';
import { SolarSystem, SolarSystemSchema } from '../../database/schemas/solar-system.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SolarSystem.name, schema: SolarSystemSchema }])],
  controllers: [SolarSystemsController],
  providers: [SolarSystemsService],
  exports: [SolarSystemsService],
})
export class SolarSystemsModule {}

