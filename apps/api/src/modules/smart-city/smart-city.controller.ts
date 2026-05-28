import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { JwtPayload } from '@solartech/shared';
import { SmartCityService } from './smart-city.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Smart City')
@Controller({ path: 'smart-city', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SmartCityController {
  constructor(private service: SmartCityService) {}

  private scope(user: JwtPayload) {
    const platformWide = user.role === 'super_admin' || user.role === 'lgu_officer';
    return {
      platformWide,
      organizationId: platformWide ? undefined : user.organizationId,
    };
  }

  @Get('overview')
  getCityOverview(
    @CurrentUser() user: JwtPayload,
    @Query('province') province?: string,
  ) {
    return this.service.getCityOverview(province, this.scope(user));
  }

  @Get('province-stats')
  getProvinceStats(@CurrentUser() user: JwtPayload) {
    return this.service.getProvinceStats(this.scope(user));
  }

  @Get('heatmap')
  getHeatmap(
    @CurrentUser() user: JwtPayload,
    @Query('province') province?: string,
  ) {
    return this.service.getGridHeatmap(province, this.scope(user));
  }

  @Get('summary-cards')
  getSummaryCards(@CurrentUser() user: JwtPayload) {
    return this.service.getCitySummaryCards(this.scope(user));
  }

  @Get('advanced-analytics')
  getAdvancedAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('province') province?: string,
  ) {
    return this.service.getAdvancedAnalytics(province, this.scope(user));
  }
}
