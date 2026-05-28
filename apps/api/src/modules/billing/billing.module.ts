import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { Invoice, InvoiceSchema } from '../../database/schemas/invoice.schema';
import { FinancingApplication, FinancingApplicationSchema } from '../../database/schemas/financing.schema';
import { Notification, NotificationSchema } from '../../database/schemas/notification.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Invoice.name, schema: InvoiceSchema },
    { name: FinancingApplication.name, schema: FinancingApplicationSchema },
    { name: Notification.name, schema: NotificationSchema },
  ])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

