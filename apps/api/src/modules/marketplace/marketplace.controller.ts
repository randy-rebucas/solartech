import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@solartech/shared';
import {
  CreateLeadDto, UpdateLeadStatusDto, CreateBidDto, SendMessageDto,
  CreateBookingDto, UpdateEscrowDto, UpdateCalendarDto,
} from './dto/marketplace.dto';

@ApiTags('Marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'marketplace', version: '1' })
export class MarketplaceController {
  constructor(private service: MarketplaceService) {}

  @Get('analytics/me')
  @ApiOperation({ summary: 'Contractor analytics for logged-in installer' })
  myAnalytics(@CurrentUser() user: JwtPayload) {
    return this.service.getMyContractorAnalytics(user);
  }

  @Get('installers/:installerId/analytics')
  @Public()
  @ApiOperation({ summary: 'Public contractor analytics' })
  installerAnalytics(@Param('installerId') installerId: string) {
    return this.service.getInstallerAnalytics(installerId);
  }

  @Get('installers/:installerId/availability')
  @Public()
  @ApiOperation({ summary: 'Availability calendar' })
  availability(@Param('installerId') installerId: string) {
    return this.service.getAvailability(installerId);
  }

  @Patch('installers/:installerId/availability')
  @ApiOperation({ summary: 'Update availability calendar' })
  updateAvailability(
    @Param('installerId') installerId: string,
    @Body() dto: UpdateCalendarDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateAvailability(installerId, dto, user);
  }

  @Get('leads')
  @ApiOperation({ summary: 'List leads (lead management)' })
  findLeads(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findLeads(user, page ?? 1, limit ?? 20);
  }

  @Post('leads')
  @ApiOperation({ summary: 'Create quotation request / lead' })
  createLead(@Body() dto: CreateLeadDto, @CurrentUser() user: JwtPayload) {
    return this.service.createLead(dto, user);
  }

  @Get('leads/:id')
  findLead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findLead(id, user);
  }

  @Patch('leads/:id/status')
  updateLeadStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateLeadStatus(id, dto.status, user);
  }

  @Post('leads/:id/bids')
  @ApiOperation({ summary: 'Submit project bid' })
  createBid(
    @Param('id') leadId: string,
    @Body() dto: CreateBidDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createBid(leadId, dto, user);
  }

  @Get('leads/:id/bids')
  findBids(@Param('id') leadId: string, @CurrentUser() user: JwtPayload) {
    return this.service.findBids(leadId, user);
  }

  @Patch('bids/:bidId/accept')
  @HttpCode(HttpStatus.OK)
  acceptBid(@Param('bidId') bidId: string, @CurrentUser() user: JwtPayload) {
    return this.service.acceptBid(bidId, user);
  }

  @Post('leads/:id/messages')
  @ApiOperation({ summary: 'Send chat message' })
  sendMessage(
    @Param('id') leadId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.sendMessage(leadId, dto, user);
  }

  @Get('leads/:id/messages')
  findMessages(@Param('id') leadId: string, @CurrentUser() user: JwtPayload) {
    return this.service.findMessages(leadId, user);
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Create booking (escrow-ready)' })
  createBooking(@Body() dto: CreateBookingDto, @CurrentUser() user: JwtPayload) {
    return this.service.createBooking(dto, user);
  }

  @Get('bookings')
  findBookings(@CurrentUser() user: JwtPayload) {
    return this.service.findBookings(user);
  }

  @Patch('bookings/:id/escrow')
  @ApiOperation({ summary: 'Advance escrow workflow' })
  updateEscrow(
    @Param('id') id: string,
    @Body() dto: UpdateEscrowDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateEscrow(id, dto, user);
  }
}
