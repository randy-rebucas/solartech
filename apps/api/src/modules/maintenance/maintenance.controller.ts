import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  MaintenanceService,
  CreateTicketDto, UpdateTicketDto, AddWorkLogDto, DispatchDto, AddPartDto,
  AddReminderDto, AddCommunicationDto,
} from './maintenance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@solartech/shared';

@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'maintenance', version: '1' })
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status')   status?: string,
    @Query('priority') priority?: string,
    @Query('page')     page?: number,
    @Query('limit')    limit?: number,
  ) {
    return this.service.findAll(user, { status, priority, page, limit });
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.service.getStats(user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/work-log')
  addWorkLog(@Param('id') id: string, @Body() dto: AddWorkLogDto, @CurrentUser() user: JwtPayload) {
    return this.service.addWorkLog(id, dto, user);
  }

  @Patch(':id/dispatch')
  dispatch(@Param('id') id: string, @Body() dto: DispatchDto, @CurrentUser() user: JwtPayload) {
    return this.service.dispatch(id, dto, user);
  }

  @Post(':id/parts')
  addPart(@Param('id') id: string, @Body() dto: AddPartDto, @CurrentUser() user: JwtPayload) {
    return this.service.addPart(id, dto, user);
  }

  @Post(':id/reminders')
  addReminder(@Param('id') id: string, @Body() dto: AddReminderDto, @CurrentUser() user: JwtPayload) {
    return this.service.addReminder(id, dto, user);
  }

  @Post(':id/communicate')
  communicate(@Param('id') id: string, @Body() dto: AddCommunicationDto, @CurrentUser() user: JwtPayload) {
    return this.service.addCommunication(id, dto, user);
  }

  @Post(':id/photos')
  addPhotos(@Param('id') id: string, @Body('images') images: string[], @CurrentUser() user: JwtPayload) {
    return this.service.addPhotos(id, images ?? [], user);
  }

  @Get('service-history/:solarSystemId')
  serviceHistory(@Param('solarSystemId') solarSystemId: string, @CurrentUser() user: JwtPayload) {
    return this.service.getServiceHistory(solarSystemId, user);
  }

  @Get('parts/inventory')
  partsInventory(@CurrentUser() user: JwtPayload) {
    return this.service.getPartsInventory(user);
  }

  @Get('fault-predictions')
  faultPredictions(@CurrentUser() user: JwtPayload) {
    return this.service.getFaultPredictions(user);
  }

  @Get('mobile/technician')
  technicianMobile(@CurrentUser() user: JwtPayload) {
    return this.service.getTechnicianMobileFeed(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user);
  }
}
