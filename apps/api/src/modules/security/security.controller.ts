import { Controller, Get, Post, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SecurityService } from './security.service';

@ApiTags('Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller({ path: 'security', version: '1' })
export class SecurityController {
  constructor(private service: SecurityService) {}

  @Get('audit-logs')
  listAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.listAuditLogs(page ?? 1, limit ?? 50);
  }

  @Post('backup/run')
  runBackup(@Body() body?: { collections?: string[]; encrypt?: boolean }) {
    return this.service.runBackup({ collections: body?.collections, encrypt: body?.encrypt });
  }
}

