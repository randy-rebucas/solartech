import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Installer, InstallerDocument } from '../../database/schemas/installer.schema';
import { Review, ReviewDocument } from '../../database/schemas/review.schema';
import type { JwtPayload } from '@solartech/shared';

export class CreateInstallerDto {
  businessName: string;
  description?: string;
  serviceAreas?: string[];
  specializations?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
}

export class CreateReviewDto {
  installerId: string;
  rating: number;
  comment: string;
}

/** Lean installer + recent reviews (avoids Mongoose populate inference blow-up). */
export type InstallerDetail = Record<string, unknown> & {
  reviews: Record<string, unknown>[];
};

@Injectable()
export class InstallersService {
  constructor(
    @InjectModel(Installer.name) private model: Model<InstallerDocument>,
    @InjectModel(Review.name)    private reviewModel: Model<ReviewDocument>,
  ) {}

  async createProfile(dto: CreateInstallerDto, user: JwtPayload) {
    const exists = await this.model.findOne({ userId: new Types.ObjectId(user.sub) });
    if (exists) throw new ConflictException('Installer profile already exists');

    return this.model.create({
      userId:         new Types.ObjectId(user.sub),
      organizationId: user.organizationId ? new Types.ObjectId(user.organizationId) : undefined,
      ...dto,
      verificationStatus: 'pending',
    });
  }

  async findAll(query: {
    city?: string;
    minRating?: number;
    verified?: boolean;
    page?: number;
    limit?: number;
  }) {
    const filter: Record<string, unknown> = {};
    // Partial match so "Manila" matches "Metro Manila", etc.
    if (query.city) {
      const escaped = query.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.serviceAreas = { $elemMatch: { $regex: escaped, $options: 'i' } };
    }
    if (query.minRating) filter.avgRating    = { $gte: query.minRating };
    if (query.verified)  filter.isVerified   = true;

    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ isFeatured: -1, avgRating: -1, totalProjects: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'firstName lastName avatarUrl')
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<InstallerDetail> {
    const installer = await this.model.findById(id)
      .populate('userId', 'firstName lastName avatarUrl phone email')
      .lean() as Record<string, unknown> | null;
    if (!installer) throw new NotFoundException('Installer not found');

    const reviews = await this.reviewModel
      .find({ installerId: new Types.ObjectId(id) })
      .populate('reviewerId', 'firstName lastName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean() as Record<string, unknown>[];

    return { ...installer, reviews };
  }

  async getMyProfile(user: JwtPayload) {
    const installer = await this.model.findOne({ userId: new Types.ObjectId(user.sub) }).lean();
    if (!installer) throw new NotFoundException('Profile not found');
    return installer;
  }

  async updateProfile(id: string, dto: Partial<CreateInstallerDto>) {
    const installer = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!installer) throw new NotFoundException();
    return installer;
  }

  async verify(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      { verificationStatus: 'verified', isVerified: true },
      { new: true },
    );
  }

  async addReview(dto: CreateReviewDto, user: JwtPayload) {
    const review = await this.reviewModel.create({
      installerId: new Types.ObjectId(dto.installerId),
      reviewerId:  new Types.ObjectId(user.sub),
      rating:      dto.rating,
      comment:     dto.comment,
    });

    // Recompute avg rating
    const stats = await this.reviewModel.aggregate([
      { $match: { installerId: new Types.ObjectId(dto.installerId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats.length) {
      await this.model.findByIdAndUpdate(dto.installerId, {
        avgRating:    Math.round(stats[0].avg * 10) / 10,
        totalReviews: stats[0].count,
      });
    }

    return review;
  }

  async getStats() {
    return this.model.aggregate([
      { $group: {
        _id: '$verificationStatus',
        count: { $sum: 1 },
        avgRating: { $avg: '$avgRating' },
      }},
    ]);
  }
}
