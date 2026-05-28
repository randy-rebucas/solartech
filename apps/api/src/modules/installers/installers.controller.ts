import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InstallersService, CreateInstallerDto, CreateReviewDto } from './installers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '@solartech/shared';

@ApiTags('Installers')
@Controller({ path: 'installers', version: '1' })
export class InstallersController {
  constructor(private service: InstallersService) {}

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createProfile(@Body() dto: CreateInstallerDto, @CurrentUser() user: JwtPayload) {
    return this.service.createProfile(dto, user);
  }

  @Get()
  @Public()
  findAll(
    @Query('city')      city?: string,
    @Query('minRating') minRating?: number,
    @Query('verified')  verified?: boolean,
    @Query('page')      page?: number,
    @Query('limit')     limit?: number,
  ) {
    return this.service.findAll({ city, minRating, verified, page, limit });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.service.getMyProfile(user);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  updateProfile(@Param('id') id: string, @Body() dto: Partial<CreateInstallerDto>) {
    return this.service.updateProfile(id, dto);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  verify(@Param('id') id: string) {
    return this.service.verify(id);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addReview(@Body() dto: CreateReviewDto, @CurrentUser() user: JwtPayload) {
    return this.service.addReview(dto, user);
  }
}
