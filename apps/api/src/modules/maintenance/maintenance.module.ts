import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceTicket, MaintenanceTicketSchema } from '../../database/schemas/maintenance.schema';
import { Device, DeviceSchema } from '../../database/schemas/device.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: MaintenanceTicket.name, schema: MaintenanceTicketSchema },
    { name: Device.name, schema: DeviceSchema },
  ])],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}

