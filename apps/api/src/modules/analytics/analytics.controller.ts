import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { rangeToDates, rangeToDays } from './analytics-range';
import type { JwtPayload } from '@solartech/shared';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.service.getOrgDashboard(user.organizationId ?? user.sub);
  }

  @Get('energy-report')
  getEnergyReport(
    @CurrentUser() user: JwtPayload,
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to')   to?: string,
  ) {
    const dates = rangeToDates(range, from, to);
    return this.service.getEnergyReport(
      user.organizationId ?? user.sub,
      dates.from,
      dates.to,
    );
  }

  @Get('carbon')
  getCarbonReport(
    @CurrentUser() user: JwtPayload,
    @Query('range') range?: string,
    @Query('days') days?: number,
  ) {
    const d = days ?? rangeToDays(range);
    return this.service.getCarbonReport(user.organizationId ?? user.sub, d);
  }

  @Get('hourly-profile')
  getHourlyProfile(
    @CurrentUser() user: JwtPayload,
    @Query('range') range?: string,
    @Query('days') days?: number,
  ) {
    const d = days ?? rangeToDays(range);
    return this.service.getHourlyProfile(user.organizationId ?? user.sub, d);
  }

  @Get('today-hourly')
  getTodayHourly(@CurrentUser() user: JwtPayload) {
    return this.service.getTodayHourlyProfile(user.organizationId ?? user.sub);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  getAdminDashboard() {
    return this.service.getAdminDashboard();
  }

  @Get('installer-performance')
  getInstallerPerformance(@CurrentUser() user: JwtPayload) {
    return this.service.getInstallerPerformance(user.organizationId ?? user.sub);
  }

  @Get('ai-monitoring')
  getAiMonitoring(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: number,
  ) {
    return this.service.getAiEnergyMonitoring(user.organizationId ?? user.sub, days ?? 30);
  }
}
