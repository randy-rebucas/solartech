import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Telemetry, TelemetrySchema }             from '../../database/schemas/telemetry.schema';
import { SolarSystem, SolarSystemSchema }          from '../../database/schemas/solar-system.schema';
import { Invoice, InvoiceSchema }                  from '../../database/schemas/invoice.schema';
import { MaintenanceTicket, MaintenanceTicketSchema } from '../../database/schemas/maintenance.schema';
import { User, UserSchema }                        from '../../database/schemas/user.schema';
import { Organization, OrganizationSchema }        from '../../database/schemas/organization.schema';
import { Notification, NotificationSchema }        from '../../database/schemas/notification.schema';
import { Device, DeviceSchema }                    from '../../database/schemas/device.schema';
import { MarketplaceLead, MarketplaceLeadSchema }  from '../../database/schemas/marketplace-lead.schema';
import { MarketplaceBooking, MarketplaceBookingSchema } from '../../database/schemas/marketplace-booking.schema';
import { SiteAnalyticsDaily, SiteAnalyticsDailySchema } from '../../database/schemas/site-analytics.schema';
import { SiteAnalyticsLocation, SiteAnalyticsLocationSchema } from '../../database/schemas/site-analytics-location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Telemetry.name,          schema: TelemetrySchema },
      { name: SolarSystem.name,        schema: SolarSystemSchema },
      { name: Invoice.name,            schema: InvoiceSchema },
      { name: MaintenanceTicket.name,  schema: MaintenanceTicketSchema },
      { name: User.name,               schema: UserSchema },
      { name: Organization.name,       schema: OrganizationSchema },
      { name: Notification.name,       schema: NotificationSchema },
      { name: Device.name,             schema: DeviceSchema },
      { name: MarketplaceLead.name,    schema: MarketplaceLeadSchema },
      { name: MarketplaceBooking.name, schema: MarketplaceBookingSchema },
      { name: SiteAnalyticsDaily.name, schema: SiteAnalyticsDailySchema },
      { name: SiteAnalyticsLocation.name, schema: SiteAnalyticsLocationSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RolesGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

