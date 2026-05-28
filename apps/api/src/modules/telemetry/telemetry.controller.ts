import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@solartech/shared';

@ApiTags('Telemetry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'telemetry', version: '1' })
export class TelemetryController {
  constructor(private service: TelemetryService) {}

  @Get('devices/:deviceId/latest')
  getLatest(@Param('deviceId') deviceId: string) {
    return this.service.getLatest(deviceId);
  }

  @Get('devices/:deviceId/history')
  @ApiQuery({ name: 'from',       required: false })
  @ApiQuery({ name: 'to',         required: false })
  @ApiQuery({ name: 'resolution', required: false, enum: ['raw','1h','1d'] })
  getHistory(
    @Param('deviceId') deviceId: string,
    @Query('from') from?: string,
    @Query('to')   to?: string,
    @Query('resolution') resolution?: 'raw' | '1h' | '1d',
  ) {
    const now = new Date();
    return this.service.getHistory(
      deviceId,
      from ? new Date(from) : new Date(now.getTime() - 86400_000),
      to   ? new Date(to)   : now,
      resolution ?? '1h',
    );
  }

  @Get('systems/:systemId/summary')
  getSystemSummary(@Param('systemId') systemId: string) {
    return this.service.getSystemSummary(systemId);
  }

  @Get('energy-stats')
  getEnergyStats(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: number,
  ) {
    return this.service.getEnergyStats(user.organizationId ?? user.sub, days);
  }
}
