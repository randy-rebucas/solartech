import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, RunDiagnosticsDto, UpdateFirmwareDto } from './dto/device.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@solartech/shared';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'devices', version: '1' })
export class DevicesController {
  constructor(private service: DevicesService) {}

  @Post()
  create(@Body() dto: CreateDeviceDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('systemId') systemId?: string) {
    return this.service.findAll(user, systemId);
  }

  @Get('iot/overview')
  getIotOverview(@CurrentUser() user: JwtPayload, @Query('hours') hours?: number) {
    return this.service.getIotOverview(user, hours ?? 24);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateStatus(id, body.status, user);
  }

  @Post(':id/command')
  sendCommand(
    @Param('id') id: string,
    @Body() command: object,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.sendCommand(id, command, user);
  }

  @Post(':id/firmware')
  updateFirmware(
    @Param('id') id: string,
    @Body() body: UpdateFirmwareDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateFirmware(id, body, user);
  }

  @Post(':id/diagnostics')
  runDiagnostics(
    @Param('id') id: string,
    @Body() body: RunDiagnosticsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.runDiagnostics(id, body, user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.delete(id, user);
  }
}
