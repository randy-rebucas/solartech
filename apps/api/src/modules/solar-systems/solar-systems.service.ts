import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SolarSystem, SolarSystemDocument } from '../../database/schemas/solar-system.schema';
import type { JwtPayload } from '@solartech/shared';
import { CreateSolarSystemDto } from './dto/solar-system.dto';

export { CreateSolarSystemDto } from './dto/solar-system.dto';

@Injectable()
export class SolarSystemsService {
  constructor(@InjectModel(SolarSystem.name) private model: Model<SolarSystemDocument>) {}

  async create(dto: CreateSolarSystemDto, user: JwtPayload) {
    return this.model.create({
      name:           dto.name,
      systemSizeKw:   dto.systemSizeKw,
      organizationId: new Types.ObjectId(user.organizationId ?? user.sub),
      clientId:       dto.clientId ? new Types.ObjectId(dto.clientId) : new Types.ObjectId(user.sub),
      quotationId:    dto.quotationId ? new Types.ObjectId(dto.quotationId) : undefined,
      location: { country: 'PH', ...dto.location },
      status: 'planning',
    });
  }

  async findAll(user: JwtPayload, page = 1, limit = 20) {
    const filter: Record<string, unknown> = {};
    if (user.role === 'client')     filter.clientId       = new Types.ObjectId(user.sub);
    else if (user.organizationId)   filter.organizationId = new Types.ObjectId(user.organizationId);

    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('clientId', 'firstName lastName email')
        .populate('quotationId', 'status')
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const sys = await this.model.findById(id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('devices')
      .lean();
    if (!sys) throw new NotFoundException('Solar system not found');
    return sys;
  }

  async updateStatus(id: string, status: string) {
    const updates: Record<string, unknown> = { status };
    if (status === 'active') updates.installedAt = new Date();
    return this.model.findByIdAndUpdate(id, updates, { new: true });
  }

  async addDevice(systemId: string, deviceId: string) {
    return this.model.findByIdAndUpdate(
      systemId,
      { $addToSet: { devices: new Types.ObjectId(deviceId) } },
      { new: true },
    );
  }

  async getMapData(organizationId?: string) {
    const filter: Record<string, unknown> = { status: 'active' };
    if (organizationId) filter.organizationId = new Types.ObjectId(organizationId);

    return this.model.find(filter, {
      name: 1, systemSizeKw: 1, status: 1,
      'location.latitude': 1, 'location.longitude': 1, 'location.city': 1,
    }).lean();
  }
}
