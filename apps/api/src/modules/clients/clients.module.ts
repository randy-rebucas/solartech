import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SolarSystem, SolarSystemSchema } from '../../database/schemas/solar-system.schema';
import { Device, DeviceSchema } from '../../database/schemas/device.schema';
import { Telemetry, TelemetrySchema } from '../../database/schemas/telemetry.schema';
import { Invoice, InvoiceSchema } from '../../database/schemas/invoice.schema';
import { MaintenanceTicket, MaintenanceTicketSchema } from '../../database/schemas/maintenance.schema';
import { Quotation, QuotationSchema } from '../../database/schemas/quotation.schema';
import { Notification, NotificationSchema } from '../../database/schemas/notification.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';

@Module({
  imports: [
    AnalyticsModule,
    MongooseModule.forFeature([
      { name: SolarSystem.name, schema: SolarSystemSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: Telemetry.name, schema: TelemetrySchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: MaintenanceTicket.name, schema: MaintenanceTicketSchema },
      { name: Quotation.name, schema: QuotationSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ClientsController],
  providers: [ClientsService, RolesGuard],
})
export class ClientsModule {}
