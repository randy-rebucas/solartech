import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from '../../database/schemas/organization.schema';
import type { JwtPayload } from '@solartech/shared';

@Injectable()
export class OrganizationsService {
  constructor(@InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>) {}

  async findAll(caller: JwtPayload, page = 1, limit = 20) {
    if (caller.role !== 'super_admin') throw new ForbiddenException();
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.orgModel.aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'organizationId',
            as: 'users',
          },
        },
        {
          $lookup: {
            from: 'solar_systems',
            localField: '_id',
            foreignField: 'organizationId',
            as: 'systems',
          },
        },
        {
          $addFields: {
            userCount: { $size: '$users' },
            systemCount: { $size: '$systems' },
          },
        },
        { $project: { users: 0, systems: 0 } },
      ]),
      this.orgModel.countDocuments(),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string, caller: JwtPayload) {
    const guard = caller.role !== 'super_admin' ? { _id: id, _orgId: caller.organizationId } : { _id: id };
    const org = await this.orgModel.findById(id);
    if (!org) throw new NotFoundException('Organization not found');
    if (caller.role !== 'super_admin' && org._id.toString() !== caller.organizationId) throw new ForbiddenException();
    return org;
  }

  async getMyOrg(caller: JwtPayload) {
    const org = await this.orgModel.findById(caller.organizationId);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, dto: Partial<{ name: string; contactEmail: string; address: string; logo: string }>, caller: JwtPayload) {
    if (caller.role !== 'super_admin' && caller.organizationId !== id) throw new ForbiddenException();
    return this.orgModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
  }

  async suspend(id: string, caller: JwtPayload) {
    if (caller.role !== 'super_admin') throw new ForbiddenException();
    return this.orgModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async activate(id: string, caller: JwtPayload) {
    if (caller.role !== 'super_admin') throw new ForbiddenException();
    return this.orgModel.findByIdAndUpdate(id, { isActive: true }, { new: true });
  }
}
