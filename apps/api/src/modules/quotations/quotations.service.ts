import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quotation, QuotationDocument } from '../../database/schemas/quotation.schema';
import { SolarCalculatorService } from './solar-calculator.service';
import type {
  CreateQuotationDto,
  UpdateQuotationInputDto,
  UpdateQuotationStatusDto,
} from './dto/quotation.dto';
import type { JwtPayload } from '@solartech/shared';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectModel(Quotation.name) private model: Model<QuotationDocument>,
    private calculator: SolarCalculatorService,
  ) {}

  async create(dto: CreateQuotationDto, user: JwtPayload) {
    const input = {
      ...dto,
      currency: dto.currency ?? 'PHP',
      province: dto.province ?? '',
    };

    const output = this.calculator.calculate(input);
    const aiInsights = await this.calculator.generateAiInsights(input, output);

    const quotation = await this.model.create({
      clientId:       dto.clientId ? new Types.ObjectId(dto.clientId) : new Types.ObjectId(user.sub),
      organizationId: user.organizationId ? new Types.ObjectId(user.organizationId) : undefined,
      createdBy:      new Types.ObjectId(user.sub),
      status:         'draft',
      input,
      output,
      notes:          aiInsights,
    });

    return quotation;
  }

  async findAll(user: JwtPayload, page = 1, limit = 20) {
    const filter: Record<string, unknown> = {};

    if (user.role === 'client') {
      filter.clientId = new Types.ObjectId(user.sub);
    } else if (user.organizationId) {
      filter.organizationId = new Types.ObjectId(user.organizationId);
    }

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('clientId', 'firstName lastName email')
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: JwtPayload) {
    const q = await this.model
      .findById(id)
      .populate('clientId', 'firstName lastName email phone')
      .lean();
    if (!q) throw new NotFoundException('Quotation not found');
    this.checkAccess(q, user);
    return q;
  }

  async updateStatus(id: string, dto: UpdateQuotationStatusDto, user: JwtPayload) {
    const q = await this.model.findById(id);
    if (!q) throw new NotFoundException('Quotation not found');
    this.checkAccess(q, user);

    q.status = dto.status;
    if (dto.notes) q.notes = dto.notes;
    await q.save();
    return q;
  }

  async recalculate(id: string, user: JwtPayload) {
    const q = await this.model.findById(id);
    if (!q) throw new NotFoundException('Quotation not found');
    this.checkAccess(q, user);

    const output = this.calculator.calculate(q.input as never);
    q.output = output as never;
    await q.save();
    return q;
  }

  async updateInput(id: string, dto: UpdateQuotationInputDto, user: JwtPayload) {
    const q = await this.model.findById(id);
    if (!q) throw new NotFoundException('Quotation not found');
    this.checkAccess(q, user);

    const input = {
      ...dto,
      currency: dto.currency ?? 'PHP',
      province: dto.province ?? '',
    };
    const output = this.calculator.calculate(input);
    q.input = input as never;
    q.output = output as never;
    await q.save();
    return q;
  }

  async generateProposal(id: string, user: JwtPayload) {
    const q = await this.model.findById(id);
    if (!q) throw new NotFoundException('Quotation not found');
    this.checkAccess(q, user);

    const input = q.input as never;
    const output = this.calculator.calculate(input);
    const notes = await this.calculator.generateAiInsights(input, output);
    q.output = output as never;
    q.notes = notes;
    await q.save();

    return {
      proposal: this.calculator.buildProposalDocument(input, output, notes),
      quotation: q,
    };
  }

  async delete(id: string, user: JwtPayload) {
    const q = await this.model.findById(id);
    if (!q) throw new NotFoundException('Quotation not found');
    this.checkAccess(q, user);
    await q.deleteOne();
    return { deleted: true };
  }

  // Quick AI-only calculation without saving
  async estimate(dto: CreateQuotationDto) {
    const input = { ...dto, currency: dto.currency ?? 'PHP', province: dto.province ?? '' };
    return this.calculator.calculate(input);
  }

  /** Normalize ObjectId or populated `{ _id }` refs for access checks. */
  private refId(ref: unknown): string | undefined {
    if (ref == null) return undefined;
    if (typeof ref === 'object' && '_id' in (ref as object)) {
      return String((ref as { _id: unknown })._id);
    }
    return String(ref);
  }

  private checkAccess(q: { clientId: unknown; organizationId?: unknown }, user: JwtPayload) {
    if (user.role === 'super_admin') return;

    const clientId = this.refId(q.clientId);
    const orgId = this.refId(q.organizationId);

    if (user.role === 'client') {
      if (clientId !== user.sub) throw new ForbiddenException();
      return;
    }

    if (user.organizationId && orgId && orgId !== user.organizationId) {
      throw new ForbiddenException();
    }
  }
}
