import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { SolarCalculatorService } from './solar-calculator.service';
import { Quotation, QuotationSchema } from '../../database/schemas/quotation.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Quotation.name, schema: QuotationSchema }])],
  controllers: [QuotationsController],
  providers: [QuotationsService, SolarCalculatorService],
  exports: [QuotationsService],
})
export class QuotationsModule {}

