import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { Installer, InstallerSchema } from '../../database/schemas/installer.schema';
import { Review, ReviewSchema } from '../../database/schemas/review.schema';
import { MarketplaceLead, MarketplaceLeadSchema } from '../../database/schemas/marketplace-lead.schema';
import { MarketplaceBid, MarketplaceBidSchema } from '../../database/schemas/marketplace-bid.schema';
import { MarketplaceBooking, MarketplaceBookingSchema } from '../../database/schemas/marketplace-booking.schema';
import { MarketplaceMessage, MarketplaceMessageSchema } from '../../database/schemas/marketplace-message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Installer.name, schema: InstallerSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: MarketplaceLead.name, schema: MarketplaceLeadSchema },
      { name: MarketplaceBid.name, schema: MarketplaceBidSchema },
      { name: MarketplaceBooking.name, schema: MarketplaceBookingSchema },
      { name: MarketplaceMessage.name, schema: MarketplaceMessageSchema },
    ]),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
