import { Body, Controller, Get, Patch, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@solartech/shared';
import type { NotificationChannel, NotificationEventKey } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  getForUser(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getForUser(user.sub, page, limit);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.markRead(id, user.sub);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.service.markAllRead(user.sub);
  }

  @Get('preferences/me')
  getMyPreferences(@CurrentUser() user: JwtPayload) {
    return this.service.getPreferences(user.sub);
  }

  @Patch('preferences/me')
  updateMyPreferences(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      channels?: Partial<Record<NotificationChannel, boolean>>;
      events?: Partial<Record<NotificationEventKey, boolean>>;
    },
  ) {
    return this.service.updatePreferences(user.sub, body);
  }

  @Post('events/:eventKey')
  triggerEvent(
    @CurrentUser() user: JwtPayload,
    @Param('eventKey') eventKey: NotificationEventKey,
    @Body() body?: {
      channels?: NotificationChannel[];
      email?: string;
      phone?: string;
      pushToken?: string;
      variables?: Record<string, string>;
    },
  ) {
    return this.service.dispatchEvent({
      eventKey,
      userId: user.sub,
      organizationId: user.organizationId,
      channels: body?.channels,
      email: body?.email ?? user.email,
      phone: body?.phone,
      pushToken: body?.pushToken,
      variables: body?.variables,
    });
  }
}
