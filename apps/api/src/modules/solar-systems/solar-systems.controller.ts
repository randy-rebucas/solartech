import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SolarSystemsService, CreateSolarSystemDto } from './solar-systems.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@solartech/shared';

@ApiTags('Solar Systems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'solar-systems', version: '1' })
export class SolarSystemsController {
  constructor(private service: SolarSystemsService) {}

  @Post()
  create(@Body() dto: CreateSolarSystemDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll(user, page ?? 1, limit ?? 20);
  }

  @Get('map')
  getMapData(@CurrentUser() user: JwtPayload) {
    return this.service.getMapData(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }

  @Patch(':id/devices/:deviceId')
  addDevice(@Param('id') id: string, @Param('deviceId') deviceId: string) {
    return this.service.addDevice(id, deviceId);
  }
}
