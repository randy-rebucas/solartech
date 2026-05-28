import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { JwtPayload } from '@solartech/shared';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('client')
@Controller({ path: 'clients', version: '1' })
export class ClientsController {
  constructor(private service: ClientsService) {}

  @Get('me/dashboard')
  getMyDashboard(@CurrentUser() user: JwtPayload) {
    return this.service.getDashboard(user);
  }
}
