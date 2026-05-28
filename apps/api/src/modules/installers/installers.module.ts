import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstallersController } from './installers.controller';
import { InstallersService } from './installers.service';
import { Installer, InstallerSchema } from '../../database/schemas/installer.schema';
import { Review, ReviewSchema } from '../../database/schemas/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Installer.name, schema: InstallerSchema },
      { name: Review.name,    schema: ReviewSchema },
    ]),
  ],
  controllers: [InstallersController],
  providers: [InstallersService],
  exports: [InstallersService],
})
export class InstallersModule {}

