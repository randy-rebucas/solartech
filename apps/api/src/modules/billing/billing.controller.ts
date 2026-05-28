import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
  RawBodyRequest, Req, Headers, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  BillingService,
  CreateInvoiceDto,
  CreateSubscriptionDto,
  CreateInstallmentPlanDto,
  CreateFinancingApplicationDto,
} from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@solartech/shared';
import type { Request } from 'express';

@ApiTags('Billing')
@Controller({ path: 'billing', version: '1' })
export class BillingController {
  constructor(private service: BillingService) {}

  @Post('invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page')   page?: number,
    @Query('limit')  limit?: number,
  ): Promise<{
    data: Array<Record<string, unknown>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.service.findAll(user, { status, page, limit });
  }

  @Get('invoices/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('invoices/:id/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  markSent(@Param('id') id: string) {
    return this.service.markSent(id);
  }

  @Post('invoices/:id/payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createPaymentIntent(@Param('id') id: string) {
    return this.service.createPaymentIntent(id);
  }

  @Post('invoices/:id/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createGatewayCheckout(
    @Param('id') id: string,
    @Body() body: { gateway: 'stripe' | 'paypal' | 'paymongo' | 'xendit' | 'bank_api' },
  ) {
    return this.service.createGatewayCheckout(id, body.gateway);
  }

  @Post('invoices/:id/pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  markPaid(
    @Param('id') id: string,
    @Body() body?: { paymentMethod?: string },
  ) {
    return this.service.markPaid(id, body?.paymentMethod);
  }

  @Post('webhooks/stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    await this.service.handleStripeWebhook(req.rawBody!, sig);
    return { received: true };
  }

  @Get('revenue-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  revenueStats(@CurrentUser() user: JwtPayload) {
    return this.service.getRevenueStats(user.organizationId ?? user.sub);
  }

  @Post('subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createSubscription(@Body() dto: CreateSubscriptionDto, @CurrentUser() user: JwtPayload) {
    return this.service.createSubscription(dto, user);
  }

  @Get('subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listSubscriptions(@CurrentUser() user: JwtPayload) {
    return this.service.listSubscriptions(user);
  }

  @Post('installments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createInstallment(@Body() dto: CreateInstallmentPlanDto, @CurrentUser() user: JwtPayload) {
    return this.service.createInstallmentPlan(dto, user);
  }

  @Post('financing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createFinancing(@Body() dto: CreateFinancingApplicationDto, @CurrentUser() user: JwtPayload) {
    return this.service.createFinancingApplication(dto, user);
  }

  @Get('financing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listFinancing(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.service.listFinancing(user, status);
  }

  @Patch('financing/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  approveFinancing(
    @Param('id') id: string,
    @Body() body: { approved: boolean; notes?: string },
  ) {
    return this.service.approveFinancing(id, body.approved, body.notes);
  }

  @Post('reminders/run')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  runReminders(@CurrentUser() user: JwtPayload) {
    return this.service.runAutoReminders(user);
  }

  @Get('financial-report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  financialReport(@CurrentUser() user: JwtPayload) {
    return this.service.getFinancialReport(user.organizationId ?? user.sub);
  }
}
