import {
  Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Installer, InstallerDocument } from '../../database/schemas/installer.schema';
import { Review, ReviewDocument } from '../../database/schemas/review.schema';
import {
  MarketplaceLead, MarketplaceLeadDocument,
} from '../../database/schemas/marketplace-lead.schema';
import { MarketplaceBid, MarketplaceBidDocument } from '../../database/schemas/marketplace-bid.schema';
import {
  MarketplaceBooking, MarketplaceBookingDocument,
} from '../../database/schemas/marketplace-booking.schema';
import {
  MarketplaceMessage, MarketplaceMessageDocument,
} from '../../database/schemas/marketplace-message.schema';
import type { JwtPayload } from '@solartech/shared';
import type {
  CreateLeadDto, CreateBidDto, SendMessageDto, CreateBookingDto, UpdateEscrowDto, UpdateCalendarDto,
} from './dto/marketplace.dto';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectModel(Installer.name) private installerModel: Model<InstallerDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(MarketplaceLead.name) private leadModel: Model<MarketplaceLeadDocument>,
    @InjectModel(MarketplaceBid.name) private bidModel: Model<MarketplaceBidDocument>,
    @InjectModel(MarketplaceBooking.name) private bookingModel: Model<MarketplaceBookingDocument>,
    @InjectModel(MarketplaceMessage.name) private messageModel: Model<MarketplaceMessageDocument>,
  ) {}

  // ─── Leads ───────────────────────────────────────────────────────────────────

  async createLead(dto: CreateLeadDto, user: JwtPayload) {
    const lead = await this.leadModel.create({
      clientId: new Types.ObjectId(user.sub),
      organizationId: user.organizationId ? new Types.ObjectId(user.organizationId) : undefined,
      installerId: dto.installerId ? new Types.ObjectId(dto.installerId) : undefined,
      title: dto.title,
      description: dto.description,
      city: dto.city,
      province: dto.province,
      systemSizeKw: dto.systemSizeKw,
      budgetMin: dto.budgetMin,
      budgetMax: dto.budgetMax,
      requestType: dto.requestType ?? 'quotation',
      preferredStartDate: dto.preferredStartDate ? new Date(dto.preferredStartDate) : undefined,
      status: dto.installerId ? 'open' : 'bidding',
      bidCount: 0,
    });

    if (dto.installerId) {
      await this.messageModel.create({
        leadId: lead._id,
        senderId: new Types.ObjectId(user.sub),
        body: `New ${dto.requestType ?? 'quotation'} request: ${dto.title}`,
      });
    }

    return lead;
  }

  async findLeads(user: JwtPayload, page = 1, limit = 20) {
    const filter: Record<string, unknown> = {};
    const installer = await this.findInstallerByUser(user.sub);

    if (user.role === 'client') {
      filter.clientId = new Types.ObjectId(user.sub);
    } else if (installer && ['installer', 'solar_company'].includes(user.role)) {
      filter.$or = [
        { installerId: installer._id },
        { status: 'bidding', installerId: { $exists: false } },
        { status: 'open', installerId: { $exists: false } },
      ];
    } else if (user.organizationId) {
      filter.organizationId = new Types.ObjectId(user.organizationId);
    }

    const [data, total] = await Promise.all([
      this.leadModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('clientId', 'firstName lastName email')
        .populate('installerId', 'businessName isVerified avgRating')
        .lean(),
      this.leadModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findLead(id: string, user: JwtPayload) {
    const lead = await this.leadModel
      .findById(id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('installerId', 'businessName isVerified avgRating serviceAreas')
      .lean();
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertLeadAccess(lead, user);
    return lead;
  }

  async updateLeadStatus(id: string, status: string, user: JwtPayload) {
    const lead = await this.leadModel.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');
    this.assertLeadAccess(lead, user);
    lead.status = status;
    if (status === 'bidding') lead.installerId = undefined;
    await lead.save();
    return lead;
  }

  // ─── Bids ────────────────────────────────────────────────────────────────────

  async createBid(leadId: string, dto: CreateBidDto, user: JwtPayload) {
    const installer = await this.requireInstallerProfile(user.sub);
    const lead = await this.leadModel.findById(leadId);
    if (!lead) throw new NotFoundException('Lead not found');
    if (!['open', 'bidding'].includes(lead.status)) {
      throw new BadRequestException('Lead is not accepting bids');
    }

    try {
      const bid = await this.bidModel.create({
        leadId: new Types.ObjectId(leadId),
        installerId: installer._id,
        submittedBy: new Types.ObjectId(user.sub),
        amount: dto.amount,
        proposalText: dto.proposalText,
        estimatedDurationDays: dto.estimatedDurationDays,
        status: 'submitted',
      });

      await this.leadModel.findByIdAndUpdate(leadId, {
        $inc: { bidCount: 1 },
        status: 'bidding',
      });

      await this.messageModel.create({
        leadId: new Types.ObjectId(leadId),
        senderId: new Types.ObjectId(user.sub),
        body: `Submitted bid: ₱${dto.amount.toLocaleString()}${dto.proposalText ? ` — ${dto.proposalText}` : ''}`,
      });

      return bid;
    } catch (e: unknown) {
      if ((e as { code?: number }).code === 11000) {
        throw new ConflictException('You already bid on this lead');
      }
      throw e;
    }
  }

  async findBids(leadId: string, user: JwtPayload) {
    await this.findLead(leadId, user);
    return this.bidModel
      .find({ leadId: new Types.ObjectId(leadId) })
      .sort({ amount: 1 })
      .populate('installerId', 'businessName isVerified avgRating totalProjects')
      .populate('submittedBy', 'firstName lastName')
      .lean();
  }

  async acceptBid(bidId: string, user: JwtPayload) {
    const bid = await this.bidModel.findById(bidId).populate('leadId');
    if (!bid) throw new NotFoundException('Bid not found');

    const lead = bid.leadId as unknown as MarketplaceLeadDocument;
    if (String(lead.clientId) !== user.sub && user.role !== 'super_admin') {
      throw new ForbiddenException();
    }

    await this.bidModel.updateMany(
      { leadId: lead._id, _id: { $ne: bid._id } },
      { status: 'rejected' },
    );
    bid.status = 'accepted';
    await bid.save();

    await this.leadModel.findByIdAndUpdate(lead._id, {
      status: 'awarded',
      installerId: bid.installerId,
    });

    return bid;
  }

  // ─── Messages ────────────────────────────────────────────────────────────────

  async sendMessage(leadId: string, dto: SendMessageDto, user: JwtPayload) {
    await this.findLead(leadId, user);
    return this.messageModel.create({
      leadId: new Types.ObjectId(leadId),
      senderId: new Types.ObjectId(user.sub),
      body: dto.body,
    });
  }

  async findMessages(leadId: string, user: JwtPayload) {
    await this.findLead(leadId, user);
    return this.messageModel
      .find({ leadId: new Types.ObjectId(leadId) })
      .sort({ createdAt: 1 })
      .populate('senderId', 'firstName lastName')
      .lean();
  }

  // ─── Bookings & escrow ───────────────────────────────────────────────────────

  async createBooking(dto: CreateBookingDto, user: JwtPayload) {
    const lead = await this.leadModel.findById(dto.leadId);
    if (!lead) throw new NotFoundException('Lead not found');
    if (String(lead.clientId) !== user.sub) throw new ForbiddenException();

    let installerId = lead.installerId;
    let amount = dto.totalAmount;

    if (dto.bidId) {
      const bid = await this.bidModel.findById(dto.bidId);
      if (!bid || String(bid.leadId) !== dto.leadId) throw new NotFoundException('Bid not found');
      installerId = bid.installerId;
      amount = bid.amount;
    }

    if (!installerId) throw new BadRequestException('Award a bid or assign an installer first');

    const booking = await this.bookingModel.create({
      leadId: lead._id,
      bidId: dto.bidId ? new Types.ObjectId(dto.bidId) : undefined,
      installerId,
      clientId: new Types.ObjectId(user.sub),
      scheduledDate: new Date(dto.scheduledDate),
      totalAmount: amount,
      escrowStatus: 'pending_deposit',
      escrowHeldAmount: 0,
      escrowReleasedAmount: 0,
      notes: dto.notes,
    });

    await this.markCalendarBooked(installerId, dto.scheduledDate);
    lead.status = 'awarded';
    await lead.save();

    return booking;
  }

  async findBookings(user: JwtPayload) {
    const filter: Record<string, unknown> = {};
    const installer = await this.findInstallerByUser(user.sub);

    if (user.role === 'client') {
      filter.clientId = new Types.ObjectId(user.sub);
    } else if (installer) {
      filter.installerId = installer._id;
    }

    return this.bookingModel
      .find(filter)
      .sort({ scheduledDate: 1 })
      .populate('installerId', 'businessName isVerified')
      .populate('clientId', 'firstName lastName')
      .populate('leadId', 'title city')
      .lean();
  }

  async updateEscrow(bookingId: string, dto: UpdateEscrowDto, user: JwtPayload) {
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    const installer = await this.findInstallerByUser(user.sub);
    const isClient = String(booking.clientId) === user.sub;
    const isInstaller = installer && String(booking.installerId) === String(installer._id);

    if (!isClient && !isInstaller && user.role !== 'super_admin') {
      throw new ForbiddenException();
    }

    booking.escrowStatus = dto.escrowStatus;
    if (dto.escrowHeldAmount != null) booking.escrowHeldAmount = dto.escrowHeldAmount;
    if (dto.escrowReleasedAmount != null) booking.escrowReleasedAmount = dto.escrowReleasedAmount;

    if (dto.escrowStatus === 'escrow_funded' && booking.escrowHeldAmount === 0) {
      booking.escrowHeldAmount = booking.totalAmount;
    }
    if (dto.escrowStatus === 'released') {
      booking.escrowReleasedAmount = booking.totalAmount;
      booking.escrowHeldAmount = 0;
    }

    await booking.save();
    return booking;
  }

  // ─── Installer analytics & calendar ─────────────────────────────────────────

  async getInstallerAnalytics(installerId: string) {
    const installer = await this.installerModel.findById(installerId).lean();
    if (!installer) throw new NotFoundException('Installer not found');

    const iid = new Types.ObjectId(installerId);
    const [leadStats, bidStats, bookingStats, reviewBreakdown] = await Promise.all([
      this.leadModel.aggregate([
        { $match: { $or: [{ installerId: iid }, { status: 'bidding' }] } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.bidModel.aggregate([
        { $match: { installerId: iid } },
        { $group: { _id: '$status', count: { $sum: 1 }, avgAmount: { $avg: '$amount' } } },
      ]),
      this.bookingModel.aggregate([
        { $match: { installerId: iid } },
        { $group: { _id: '$escrowStatus', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      ]),
      this.reviewModel.aggregate([
        { $match: { installerId: iid } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    const openLeads = await this.leadModel.countDocuments({
      status: { $in: ['open', 'bidding'] },
      $or: [{ installerId: iid }, { installerId: { $exists: false } }],
    });

    return {
      profile: {
        businessName: installer.businessName,
        isVerified: installer.isVerified,
        isFeatured: installer.isFeatured,
        avgRating: installer.avgRating,
        totalReviews: installer.totalReviews,
        totalProjects: installer.totalProjects,
      },
      leads: { byStatus: leadStats, openMarketplaceLeads: openLeads },
      bids: bidStats,
      bookings: bookingStats,
      reviews: reviewBreakdown,
      winRate: this.calcWinRate(bidStats),
    };
  }

  async getAvailability(installerId: string) {
    const installer = await this.installerModel.findById(installerId).lean();
    if (!installer) throw new NotFoundException('Installer not found');
    return {
      weekdays: installer.availability ?? {},
      calendarSlots: installer.calendarSlots ?? [],
    };
  }

  async updateAvailability(installerId: string, dto: UpdateCalendarDto, user: JwtPayload) {
    const installer = await this.installerModel.findById(installerId);
    if (!installer) throw new NotFoundException('Installer not found');
    if (String(installer.userId) !== user.sub && user.role !== 'super_admin') {
      throw new ForbiddenException();
    }
    installer.calendarSlots = dto.slots;
    await installer.save();
    return this.getAvailability(installerId);
  }

  async getMyContractorAnalytics(user: JwtPayload) {
    const installer = await this.requireInstallerProfile(user.sub);
    return this.getInstallerAnalytics(String(installer._id));
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private calcWinRate(bidStats: Array<{ _id: string; count: number }>) {
    const accepted = bidStats.find((b) => b._id === 'accepted')?.count ?? 0;
    const total = bidStats.reduce((s, b) => s + b.count, 0);
    return total > 0 ? Math.round((accepted / total) * 100) : 0;
  }

  private async findInstallerByUser(userId: string) {
    return this.installerModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
  }

  private async requireInstallerProfile(userId: string) {
    const installer = await this.findInstallerByUser(userId);
    if (!installer) throw new ForbiddenException('Installer profile required');
    return installer;
  }

  private assertLeadAccess(
    lead: { clientId: unknown; installerId?: unknown; status?: string },
    user: JwtPayload,
  ) {
    if (user.role === 'super_admin') return;

    const clientRef = lead.clientId as { _id?: unknown } | Types.ObjectId | string;
    const clientId = String(
      typeof clientRef === 'object' && clientRef && '_id' in clientRef
        ? clientRef._id
        : clientRef,
    );
    if (clientId === user.sub) return;

    if (['installer', 'solar_company'].includes(user.role)) {
      const instRef = lead.installerId as { _id?: unknown } | Types.ObjectId | string | undefined;
      const leadInstId = instRef
        ? String(typeof instRef === 'object' && '_id' in instRef ? instRef._id : instRef)
        : undefined;
      if (!leadInstId && ['open', 'bidding'].includes(lead.status ?? '')) return;
      return;
    }

    throw new ForbiddenException();
  }

  private async markCalendarBooked(installerId: Types.ObjectId, dateIso: string) {
    const date = dateIso.slice(0, 10);
    await this.installerModel.findByIdAndUpdate(installerId, {
      $pull: { calendarSlots: { date } },
    });
    await this.installerModel.findByIdAndUpdate(installerId, {
      $push: { calendarSlots: { date, status: 'booked' } },
    });
  }
}
