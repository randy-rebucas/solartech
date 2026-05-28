import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@solartech/shared';

@ApiTags('Organizations')
@Controller({ path: 'organizations', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private service: OrganizationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll(user, page, limit);
  }

  @Get('me')
  getMyOrg(@CurrentUser() user: JwtPayload) {
    return this.service.getMyOrg(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.suspend(id, user);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.activate(id, user);
  }
}
