import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import type { JwtPayload } from '@solartech/shared';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(caller: JwtPayload, page = 1, limit = 20) {
    const filter = caller.role === 'super_admin' ? {} : { organizationId: caller.organizationId };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.userModel.find(filter).select('-password -refreshToken -mfaSecret').skip(skip).limit(limit).sort({ createdAt: -1 }),
      this.userModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string, caller: JwtPayload) {
    const user = await this.userModel.findById(id).select('-password -refreshToken -mfaSecret');
    if (!user) throw new NotFoundException('User not found');
    if (caller.role !== 'super_admin' && user.organizationId?.toString() !== caller.organizationId) {
      throw new ForbiddenException();
    }
    return user;
  }

  async updateProfile(id: string, dto: Partial<{ firstName: string; lastName: string; phone: string; avatar: string }>, caller: JwtPayload) {
    if (caller.sub !== id && caller.role !== 'super_admin') throw new ForbiddenException();
    return this.userModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).select('-password -refreshToken -mfaSecret');
  }

  async deactivate(id: string, caller: JwtPayload) {
    if (caller.role !== 'super_admin' && caller.role !== 'solar_company') throw new ForbiddenException();
    return this.userModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).select('-password -refreshToken -mfaSecret');
  }

  async activate(id: string, caller: JwtPayload) {
    if (caller.role !== 'super_admin') throw new ForbiddenException();
    return this.userModel.findByIdAndUpdate(id, { isActive: true }, { new: true }).select('-password -refreshToken -mfaSecret');
  }

  async getMe(caller: JwtPayload) {
    return this.userModel.findById(caller.sub).select('-password -refreshToken -mfaSecret');
  }
}
