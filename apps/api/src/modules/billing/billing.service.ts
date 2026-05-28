import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from '../../database/schemas/invoice.schema';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { JwtPayload } from '@solartech/shared';
import {
  FinancingApplication,
  FinancingApplicationDocument,
} from '../../database/schemas/financing.schema';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';

export class CreateInvoiceDto {
  clientId: string;
  solarSystemId?: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
  dueDate: string;
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
  billingType?: 'one_time' | 'subscription' | 'installment';
  commissionRate?: number;
  commissionRecipientUserId?: string;
}

export class CreateSubscriptionDto {
  clientId: string;
  solarSystemId?: string;
  planName: string;
  amount: number;
  interval: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  gateway?: 'stripe' | 'paypal' | 'paymongo' | 'xendit' | 'bank_api';
}

export class CreateInstallmentPlanDto {
  clientId: string;
  solarSystemId?: string;
  principalAmount: number;
  downPayment?: number;
  termMonths: number;
  annualRate: number;
  startDate: string;
}

export class CreateFinancingApplicationDto {
  clientId: string;
  invoiceId?: string;
  provider: 'bank_api' | 'in_house' | 'maya_business' | 'gcash_business';
  amount: number;
  termMonths: number;
  annualRate: number;
  notes?: string;
}

@Injectable()
export class BillingService {
  private stripe?: Stripe;

  constructor(
    @InjectModel(Invoice.name) private model: Model<InvoiceDocument>,
    @InjectModel(FinancingApplication.name)
    private financingModel: Model<FinancingApplicationDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private config: ConfigService,
  ) {
    const key = config.get<string>('app.stripe.secretKey');
    if (key) this.stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  }

  private generateInvoiceNumber(): string {
    return `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
  }

  async create(dto: CreateInvoiceDto, user: JwtPayload) {
    const lineItems = dto.lineItems.map((li) => ({
      ...li,
      total: li.quantity * li.unitPrice,
    }));
    const subtotal       = lineItems.reduce((s, li) => s + li.total, 0);
    const taxRate        = dto.taxRate ?? 0.12;
    const discountAmount = dto.discountAmount ?? 0;
    const taxAmount      = (subtotal - discountAmount) * taxRate;
    const total          = subtotal - discountAmount + taxAmount;

    return this.model.create({
      invoiceNumber:  this.generateInvoiceNumber(),
      clientId:       new Types.ObjectId(dto.clientId),
      organizationId: new Types.ObjectId(user.organizationId ?? user.sub),
      solarSystemId:  dto.solarSystemId ? new Types.ObjectId(dto.solarSystemId) : undefined,
      billingType: dto.billingType ?? 'one_time',
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      total,
      dueDate: new Date(dto.dueDate),
      nextReminderAt: new Date(dto.dueDate),
      notes:   dto.notes,
      commission: dto.commissionRate != null
        ? {
            recipientUserId: dto.commissionRecipientUserId
              ? new Types.ObjectId(dto.commissionRecipientUserId)
              : undefined,
            rate: dto.commissionRate,
            amount: Math.round(total * dto.commissionRate),
            status: 'pending',
          }
        : undefined,
    });
  }

  async findAll(user: JwtPayload, filter: {
    status?: string; page?: number; limit?: number;
  }): Promise<{
    data: Array<Record<string, unknown>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: Record<string, unknown> = {};

    if (user.role === 'client') {
      query.clientId = new Types.ObjectId(user.sub);
    } else if (user.organizationId) {
      query.organizationId = new Types.ObjectId(user.organizationId);
    }

    if (filter.status) query.status = filter.status;

    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 20;

    const [dataRaw, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('clientId', 'firstName lastName email').lean(),
      this.model.countDocuments(query),
    ]);

    const now = Date.now();
    const data = dataRaw.map((inv) => {
      const dueMs = inv.dueDate ? new Date(inv.dueDate).getTime() : now;
      const daysToDue = Math.ceil((dueMs - now) / 86400_000);
      return {
        ...inv,
        daysToDue,
        dueState: daysToDue < 0 ? 'overdue' : daysToDue <= 3 ? 'due_soon' : 'on_track',
      };
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const invoice = await this.model.findById(id)
      .populate('clientId', 'firstName lastName email phone')
      .lean();
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async markSent(id: string) {
    return this.model.findByIdAndUpdate(id, { status: 'sent' }, { new: true });
  }

  async markPaid(id: string, paymentMethod = 'bank_transfer') {
    const invoice = await this.model.findByIdAndUpdate(
      id,
      { status: 'paid', paidAt: new Date(), paymentMethod },
      { new: true },
    );
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.installmentPlan && invoice.installmentPlan.paidInstallments < invoice.installmentPlan.totalInstallments) {
      invoice.installmentPlan.paidInstallments += 1;
      const nextSchedule = invoice.installmentPlan.schedule.find((s) => s.status === 'pending');
      if (nextSchedule) nextSchedule.status = 'paid';
      const nextPending = invoice.installmentPlan.schedule.find((s) => s.status === 'pending');
      invoice.installmentPlan.nextDueDate = nextPending?.dueDate;
      await invoice.save();
    }
    if (invoice.commission?.status === 'pending') {
      invoice.commission.status = 'accrued';
      await invoice.save();
    }
    return invoice;
  }

  async createPaymentIntent(id: string) {
    if (!this.stripe) throw new Error('Stripe not configured');
    const invoice = await this.model.findById(id);
    if (!invoice) throw new NotFoundException();

    const intent = await this.stripe.paymentIntents.create({
      amount:   Math.round(invoice.total * 100),
      currency: invoice.currency.toLowerCase(),
      metadata: { invoiceId: id, invoiceNumber: invoice.invoiceNumber },
    });

    await this.model.findByIdAndUpdate(id, { stripePaymentIntentId: intent.id });
    return { clientSecret: intent.client_secret };
  }

  async createGatewayCheckout(id: string, gateway: string) {
    const invoice = await this.model.findById(id).lean();
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (gateway === 'stripe' && this.stripe) {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(invoice.total * 100),
        currency: invoice.currency.toLowerCase(),
        metadata: { invoiceId: id, gateway: 'stripe' },
      });
      await this.model.findByIdAndUpdate(id, { stripePaymentIntentId: intent.id });
      return { gateway, clientSecret: intent.client_secret, providerRef: intent.id };
    }

    const providerRef = `${gateway}-${Date.now().toString(36)}`;
    const mockBase = gateway === 'paypal'
      ? 'https://www.paypal.com/checkoutnow'
      : gateway === 'bank_api'
        ? 'https://bank-financing.example/checkout'
        : 'https://checkout.paymongo.com/link';
    return {
      gateway,
      providerRef,
      redirectUrl: `${mockBase}?ref=${providerRef}&invoice=${invoice.invoiceNumber}`,
      note: 'Sandbox/mock URL. Replace with production gateway SDK credentials.',
    };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) return;
    const webhookSecret = this.config.get<string>('app.stripe.webhookSecret')!;

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new Error('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await this.model.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: 'paid', paidAt: new Date(), paymentMethod: 'stripe' },
      );
    }
  }

  async getRevenueStats(organizationId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    const [monthly, yearly, outstanding, recent] = await Promise.all([
      this.model.aggregate([
        { $match: { organizationId: new Types.ObjectId(organizationId), status: 'paid', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: { organizationId: new Types.ObjectId(organizationId), status: 'paid', paidAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: { organizationId: new Types.ObjectId(organizationId), status: { $in: ['sent','overdue'] } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: { organizationId: new Types.ObjectId(organizationId) } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$total' } } },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);

    const remindersDue = await this.model.countDocuments({
      organizationId: new Types.ObjectId(organizationId),
      status: { $in: ['sent', 'overdue'] },
      nextReminderAt: { $lte: now },
    });

    const commissions = await this.model.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(organizationId),
          'commission.amount': { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$commission.status',
          total: { $sum: '$commission.amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      thisMonth:   monthly[0]   ?? { total: 0, count: 0 },
      thisYear:    yearly[0]    ?? { total: 0, count: 0 },
      outstanding: outstanding[0] ?? { total: 0, count: 0 },
      monthlyTrend: recent.reverse(),
      remindersDue,
      commissionSummary: commissions,
    };
  }

  async createSubscription(dto: CreateSubscriptionDto, user: JwtPayload) {
    const intervalMonths = dto.interval === 'monthly' ? 1 : dto.interval === 'quarterly' ? 3 : 12;
    const start = new Date(dto.startDate);
    const nextBilling = new Date(start);
    nextBilling.setMonth(nextBilling.getMonth() + intervalMonths);

    return this.model.create({
      invoiceNumber: this.generateInvoiceNumber(),
      clientId: new Types.ObjectId(dto.clientId),
      organizationId: new Types.ObjectId(user.organizationId ?? user.sub),
      solarSystemId: dto.solarSystemId ? new Types.ObjectId(dto.solarSystemId) : undefined,
      billingType: 'subscription',
      status: 'sent',
      lineItems: [{ description: `${dto.planName} subscription`, quantity: 1, unitPrice: dto.amount, total: dto.amount }],
      subtotal: dto.amount,
      taxRate: 0.12,
      taxAmount: dto.amount * 0.12,
      discountAmount: 0,
      total: dto.amount * 1.12,
      dueDate: start,
      nextReminderAt: start,
      subscription: {
        planName: dto.planName,
        interval: dto.interval,
        startDate: start,
        nextBillingDate: nextBilling,
        active: true,
        gateway: dto.gateway ?? 'stripe',
      },
    });
  }

  async listSubscriptions(user: JwtPayload) {
    const orgId = new Types.ObjectId(user.organizationId ?? user.sub);
    return this.model.find({
      organizationId: orgId,
      billingType: 'subscription',
      'subscription.active': true,
    }).sort({ createdAt: -1 }).lean();
  }

  async createInstallmentPlan(dto: CreateInstallmentPlanDto, user: JwtPayload) {
    const principal = dto.principalAmount - (dto.downPayment ?? 0);
    const monthlyRate = dto.annualRate / 12;
    const installmentAmount = Math.round(((principal * (1 + monthlyRate)) / dto.termMonths) * 100) / 100;
    const start = new Date(dto.startDate);

    const schedule = Array.from({ length: dto.termMonths }, (_, i) => {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i);
      return { dueDate, amount: installmentAmount, status: 'pending' };
    });

    return this.model.create({
      invoiceNumber: this.generateInvoiceNumber(),
      clientId: new Types.ObjectId(dto.clientId),
      organizationId: new Types.ObjectId(user.organizationId ?? user.sub),
      solarSystemId: dto.solarSystemId ? new Types.ObjectId(dto.solarSystemId) : undefined,
      billingType: 'installment',
      status: 'sent',
      lineItems: [{ description: `Installment plan (${dto.termMonths} months)`, quantity: 1, unitPrice: principal, total: principal }],
      subtotal: principal,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: dto.downPayment ?? 0,
      total: principal,
      dueDate: schedule[0].dueDate,
      nextReminderAt: schedule[0].dueDate,
      installmentPlan: {
        totalInstallments: dto.termMonths,
        paidInstallments: 0,
        installmentAmount,
        interestRate: dto.annualRate,
        nextDueDate: schedule[0].dueDate,
        schedule,
      },
    });
  }

  async createFinancingApplication(dto: CreateFinancingApplicationDto, user: JwtPayload) {
    return this.financingModel.create({
      organizationId: new Types.ObjectId(user.organizationId ?? user.sub),
      clientId: new Types.ObjectId(dto.clientId),
      invoiceId: dto.invoiceId ? new Types.ObjectId(dto.invoiceId) : undefined,
      referenceNo: `FIN-${Date.now().toString(36).toUpperCase()}`,
      provider: dto.provider,
      amount: dto.amount,
      termMonths: dto.termMonths,
      annualRate: dto.annualRate,
      notes: dto.notes,
      status: 'submitted',
      metadata: {
        integrations: ['stripe', 'paypal', 'paymongo', 'xendit', 'bank_api'],
      },
    });
  }

  async approveFinancing(id: string, approved: boolean, reviewerNotes?: string) {
    const app = await this.financingModel.findById(id);
    if (!app) throw new NotFoundException('Financing application not found');
    app.status = approved ? 'approved' : 'rejected';
    app.approvedAt = new Date();
    app.notes = reviewerNotes ?? app.notes;
    await app.save();
    return app;
  }

  async listFinancing(user: JwtPayload, status?: string) {
    const query: Record<string, unknown> = { organizationId: new Types.ObjectId(user.organizationId ?? user.sub) };
    if (status) query.status = status;
    return this.financingModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async runAutoReminders(user: JwtPayload) {
    const orgId = new Types.ObjectId(user.organizationId ?? user.sub);
    const now = new Date();
    const dueInvoices = await this.model.find({
      organizationId: orgId,
      status: { $in: ['sent', 'overdue'] },
      nextReminderAt: { $lte: now },
    }).limit(50);

    const reminderPayload = dueInvoices.map(async (inv) => {
      const isOverdue = inv.dueDate < now;
      if (isOverdue && inv.status !== 'overdue') inv.status = 'overdue';
      inv.reminderSentAt = now;
      inv.nextReminderAt = new Date(now.getTime() + 2 * 86400_000);
      await inv.save();

      return this.notificationModel.create({
        userId: inv.clientId,
        organizationId: inv.organizationId,
        event: isOverdue ? 'billing.overdue' : 'billing.reminder',
        channel: 'in_app',
        title: isOverdue ? 'Invoice overdue reminder' : 'Invoice due reminder',
        body: `${inv.invoiceNumber} is ${isOverdue ? 'overdue' : 'due soon'} for ₱${Math.round(inv.total).toLocaleString()}.`,
        data: { invoiceId: String(inv._id) },
        sentAt: now,
      });
    });

    await Promise.all(reminderPayload);
    return { remindersSent: dueInvoices.length };
  }

  async getFinancialReport(organizationId: string) {
    const orgId = new Types.ObjectId(organizationId);
    const now = new Date();
    const [aging, subscriptions, installments, loans, commissions] = await Promise.all([
      this.model.aggregate([
        { $match: { organizationId: orgId, status: { $in: ['sent', 'overdue'] } } },
        {
          $project: {
            total: 1,
            bucket: {
              $switch: {
                branches: [
                  { case: { $lte: [{ $subtract: [now, '$dueDate'] }, 7 * 86400_000] }, then: '0-7d' },
                  { case: { $lte: [{ $subtract: [now, '$dueDate'] }, 30 * 86400_000] }, then: '8-30d' },
                ],
                default: '31d+',
              },
            },
          },
        },
        { $group: { _id: '$bucket', total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      this.model.countDocuments({ organizationId: orgId, billingType: 'subscription', 'subscription.active': true }),
      this.model.countDocuments({ organizationId: orgId, billingType: 'installment' }),
      this.financingModel.countDocuments({ organizationId: orgId }),
      this.model.aggregate([
        { $match: { organizationId: orgId, 'commission.amount': { $gt: 0 } } },
        { $group: { _id: '$commission.status', total: { $sum: '$commission.amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const revenue = await this.getRevenueStats(organizationId);
    return {
      generatedAt: now.toISOString(),
      dueDateTracking: aging,
      subscriptions,
      installmentPlans: installments,
      financingApplications: loans,
      commissions,
      revenue,
      integrations: {
        stripe: Boolean(this.stripe),
        paypal: true,
        localPH: ['PayMongo', 'Xendit', 'Maya Business', 'GCash Business'],
        bankFinancing: ['BPI', 'BDO', 'UnionBank', 'Landbank (mock APIs)'],
      },
    };
  }
}
