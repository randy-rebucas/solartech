import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaintenanceTicket, MaintenanceTicketDocument } from '../../database/schemas/maintenance.schema';
import { Device, DeviceDocument } from '../../database/schemas/device.schema';
import type { JwtPayload } from '@solartech/shared';

export class CreateTicketDto {
  solarSystemId: string;
  title: string;
  description: string;
  priority?: string;
  type?: string;
  images?: string[];
  scheduledAt?: string;
  preventiveIntervalDays?: number;
  installDate?: string;
  expectedEndOfLife?: string;
}

export class UpdateTicketDto {
  status?: string;
  priority?: string;
  assignedTechnicianId?: string;
  resolution?: string;
  scheduledAt?: string;
  laborCost?: number;
  preventiveIntervalDays?: number;
  assetHealthScore?: number;
}

export class AddWorkLogDto {
  action: string;
  notes?: string;
  images?: string[];
}

export class DispatchDto {
  assignedTechnicianId: string;
  eta?: string;
  routeNote?: string;
}

export class AddPartDto {
  name: string;
  quantity: number;
  unitCost: number;
  status?: 'needed' | 'ordered' | 'received' | 'installed';
}

export class AddReminderDto {
  title: string;
  remindAt: string;
}

export class AddCommunicationDto {
  channel: 'in_app' | 'sms' | 'email' | 'phone';
  message: string;
}

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(MaintenanceTicket.name) private model: Model<MaintenanceTicketDocument>,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async create(dto: CreateTicketDto, user: JwtPayload) {
    const slaHours = dto.priority === 'critical' ? 4 : dto.priority === 'high' ? 24 : 72;
    const now = Date.now();
    const workOrderNo = `WO-${new Date().getFullYear()}-${Math.floor(now / 1000).toString().slice(-7)}`;
    return this.model.create({
      solarSystemId:  new Types.ObjectId(dto.solarSystemId),
      organizationId: new Types.ObjectId(user.organizationId ?? user.sub),
      clientId:       new Types.ObjectId(user.sub),
      title:          dto.title,
      workOrderNo,
      description:    dto.description,
      priority:       dto.priority ?? 'medium',
      type:           dto.type ?? 'corrective',
      images:         dto.images ?? [],
      scheduledAt:    dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      slaDeadline:    new Date(Date.now() + slaHours * 3600_000),
      preventivePlan: dto.preventiveIntervalDays ? {
        enabled: true,
        intervalDays: dto.preventiveIntervalDays,
        nextDueAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(now + dto.preventiveIntervalDays * 86400_000),
      } : undefined,
      assetLifecycle: {
        stage: 'active',
        installDate: dto.installDate ? new Date(dto.installDate) : undefined,
        expectedEndOfLife: dto.expectedEndOfLife ? new Date(dto.expectedEndOfLife) : undefined,
        healthScore: 85,
      },
    });
  }

  async findAll(user: JwtPayload, filter: {
    status?: string;
    priority?: string;
    technicianId?: string;
    page?: number;
    limit?: number;
  }) {
    const query: Record<string, unknown> = {};

    if (user.role === 'client') {
      query.clientId = new Types.ObjectId(user.sub);
    } else if (user.role === 'technician') {
      query.assignedTechnicianId = new Types.ObjectId(user.sub);
    } else if (user.organizationId) {
      query.organizationId = new Types.ObjectId(user.organizationId);
    }

    if (filter.status)    query.status   = filter.status;
    if (filter.priority)  query.priority = filter.priority;

    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 20;

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ priority: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('clientId', 'firstName lastName email phone')
        .populate('assignedTechnicianId', 'firstName lastName phone')
        .populate('solarSystemId', 'name location')
        .lean(),
      this.model.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: JwtPayload) {
    const ticket = await this.model.findById(id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('assignedTechnicianId', 'firstName lastName phone')
      .populate('solarSystemId', 'name location devices')
      .lean();
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, user: JwtPayload) {
    const ticket = await this.model.findById(id);
    if (!ticket) throw new NotFoundException();

    if (dto.status === 'resolved' && !dto.resolution) {
      throw new BadRequestException('Resolution notes required when closing ticket');
    }

    Object.assign(ticket, {
      ...dto,
      assignedTechnicianId: dto.assignedTechnicianId
        ? new Types.ObjectId(dto.assignedTechnicianId) : ticket.assignedTechnicianId,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : ticket.scheduledAt,
      resolvedAt:  dto.status === 'resolved' ? new Date() : ticket.resolvedAt,
      preventivePlan: dto.preventiveIntervalDays ? {
        enabled: true,
        intervalDays: dto.preventiveIntervalDays,
        nextDueAt: new Date(Date.now() + dto.preventiveIntervalDays * 86400_000),
      } : ticket.preventivePlan,
      assetLifecycle: dto.assetHealthScore != null ? {
        ...(ticket.assetLifecycle ?? {}),
        healthScore: dto.assetHealthScore,
        stage: dto.assetHealthScore < 30 ? 'critical' : dto.assetHealthScore < 60 ? 'aging' : 'active',
      } : ticket.assetLifecycle,
    });

    await ticket.save();
    return ticket;
  }

  async addWorkLog(id: string, dto: AddWorkLogDto, user: JwtPayload) {
    const ticket = await this.model.findById(id);
    if (!ticket) throw new NotFoundException();

    ticket.workLog.push({
      technicianId: new Types.ObjectId(user.sub),
      action:    dto.action,
      notes:     dto.notes,
      timestamp: new Date(),
      images:    dto.images ?? [],
    });

    if (ticket.status === 'assigned') ticket.status = 'in_progress';
    await ticket.save();
    return ticket;
  }

  async dispatch(id: string, dto: DispatchDto, _user: JwtPayload) {
    const ticket = await this.model.findById(id);
    if (!ticket) throw new NotFoundException();
    ticket.assignedTechnicianId = new Types.ObjectId(dto.assignedTechnicianId);
    ticket.dispatch = {
      technicianId: new Types.ObjectId(dto.assignedTechnicianId),
      eta: dto.eta ? new Date(dto.eta) : undefined,
      routeNote: dto.routeNote,
      status: 'dispatched',
    };
    if (ticket.status === 'open') ticket.status = 'assigned';
    await ticket.save();
    return ticket;
  }

  async addPart(id: string, dto: AddPartDto, _user: JwtPayload) {
    const ticket = await this.model.findById(id);
    if (!ticket) throw new NotFoundException();
    ticket.parts.push({
      name: dto.name,
      quantity: dto.quantity,
      unitCost: dto.unitCost,
      status: dto.status ?? 'needed',
    });
    if (ticket.status === 'in_progress' && ticket.parts.some((p) => p.status === 'needed' || p.status === 'ordered')) {
      ticket.status = 'pending_parts';
    }
    await ticket.save();
    return ticket;
  }

  async addReminder(id: string, dto: AddReminderDto, _user: JwtPayload) {
    const ticket = await this.model.findById(id);
    if (!ticket) throw new NotFoundException();
    ticket.reminders.push({
      title: dto.title,
      remindAt: new Date(dto.remindAt),
      sent: false,
    });
    await ticket.save();
    return ticket;
  }

  async addCommunication(id: string, dto: AddCommunicationDto, user: JwtPayload) {
    const ticket = await this.model.findById(id);
    if (!ticket) throw new NotFoundException();
    ticket.communications.push({
      channel: dto.channel,
      message: dto.message,
      createdBy: new Types.ObjectId(user.sub),
      createdAt: new Date(),
    });
    await ticket.save();
    return ticket;
  }

  async addPhotos(id: string, images: string[], _user: JwtPayload) {
    const ticket = await this.model.findById(id);
    if (!ticket) throw new NotFoundException();
    ticket.images.push(...images.filter(Boolean));
    await ticket.save();
    return ticket;
  }

  async getServiceHistory(solarSystemId: string, user: JwtPayload) {
    const query: Record<string, unknown> = {
      solarSystemId: new Types.ObjectId(solarSystemId),
    };
    if (user.organizationId) query.organizationId = new Types.ObjectId(user.organizationId);
    return this.model
      .find(query)
      .sort({ createdAt: -1 })
      .populate('assignedTechnicianId', 'firstName lastName')
      .lean();
  }

  async getPartsInventory(user: JwtPayload) {
    const orgFilter = user.organizationId ? { organizationId: new Types.ObjectId(user.organizationId) } : {};
    const rows = await this.model.aggregate([
      { $match: orgFilter },
      { $unwind: { path: '$parts', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$parts.name',
          totalQty: { $sum: '$parts.quantity' },
          avgUnitCost: { $avg: '$parts.unitCost' },
          neededCount: {
            $sum: {
              $cond: [{ $in: ['$parts.status', ['needed', 'ordered']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { neededCount: -1, totalQty: -1 } },
    ]);
    return rows.map((r) => ({
      part: r._id,
      totalQty: r.totalQty,
      avgUnitCost: Math.round(r.avgUnitCost ?? 0),
      neededCount: r.neededCount,
    }));
  }

  async getFaultPredictions(user: JwtPayload) {
    const orgFilter = user.organizationId ? { organizationId: new Types.ObjectId(user.organizationId) } : {};
    const [devices, openTickets] = await Promise.all([
      this.deviceModel.find({ ...orgFilter, status: { $in: ['warning', 'error', 'offline'] } }).lean(),
      this.model.find({ ...orgFilter, status: { $in: ['open', 'assigned', 'in_progress', 'pending_parts'] } }).lean(),
    ]);

    const bySystem = new Map<string, { risk: number; reasons: string[] }>();
    for (const d of devices) {
      const sid = d.solarSystemId ? String(d.solarSystemId) : 'unknown';
      const curr = bySystem.get(sid) ?? { risk: 20, reasons: [] };
      const bump = d.status === 'error' ? 35 : d.status === 'warning' ? 20 : 15;
      curr.risk = Math.min(99, curr.risk + bump);
      curr.reasons.push(`${d.name} is ${d.status}`);
      bySystem.set(sid, curr);
    }
    for (const t of openTickets) {
      const sid = String(t.solarSystemId);
      const curr = bySystem.get(sid) ?? { risk: 15, reasons: [] };
      const bump = t.priority === 'critical' ? 30 : t.priority === 'high' ? 18 : 8;
      curr.risk = Math.min(99, curr.risk + bump);
      curr.reasons.push(`Open ${t.priority} ticket: ${t.title}`);
      bySystem.set(sid, curr);
    }
    return Array.from(bySystem.entries()).map(([solarSystemId, v]) => ({
      solarSystemId,
      riskScore: v.risk,
      severity: v.risk >= 80 ? 'high' : v.risk >= 50 ? 'medium' : 'low',
      reasons: v.reasons.slice(0, 3),
      recommendation: v.risk >= 80
        ? 'Dispatch technician within 24h and prepare parts.'
        : v.risk >= 50
          ? 'Schedule preventive inspection this week.'
          : 'Continue monitoring and automated reminders.',
    }));
  }

  async getTechnicianMobileFeed(user: JwtPayload) {
    if (user.role !== 'technician' && user.role !== 'super_admin') {
      throw new ForbiddenException();
    }
    const query: Record<string, unknown> = {
      status: { $in: ['assigned', 'in_progress', 'pending_parts'] },
    };
    if (user.role === 'technician') query.assignedTechnicianId = new Types.ObjectId(user.sub);
    const tickets = await this.model.find(query)
      .sort({ priority: 1, scheduledAt: 1, createdAt: -1 })
      .limit(30)
      .populate('solarSystemId', 'name location')
      .lean();
    return tickets.map((t) => ({
      id: t._id,
      workOrderNo: t.workOrderNo,
      title: t.title,
      priority: t.priority,
      status: t.status,
      scheduledAt: t.scheduledAt,
      dispatchEta: t.dispatch?.eta,
      location: (t.solarSystemId as { location?: unknown })?.location,
      photos: t.images?.length ?? 0,
      checklist: [
        { key: 'arrive', label: 'Arrive on site', done: t.dispatch?.status === 'arrived' },
        { key: 'diagnose', label: 'Run diagnostics', done: t.workLog.length > 0 },
        { key: 'resolve', label: 'Resolve / update client', done: ['resolved', 'closed'].includes(t.status) },
      ],
    }));
  }

  async getStats(user: JwtPayload) {
    const orgFilter = user.organizationId
      ? { organizationId: new Types.ObjectId(user.organizationId) }
      : {};

    const [statusStats, priorityStats, slaBreached, remindersDue] = await Promise.all([
      this.model.aggregate([
        { $match: orgFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: { ...orgFilter, status: { $in: ['open','assigned','in_progress'] } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      this.model.countDocuments({
        ...orgFilter,
        slaDeadline: { $lt: new Date() },
        status: { $nin: ['resolved','closed','cancelled'] },
      }),
      this.model.countDocuments({
        ...orgFilter,
        reminders: { $elemMatch: { remindAt: { $lte: new Date() }, sent: false } },
      }),
    ]);

    return { statusStats, priorityStats, slaBreached, remindersDue };
  }
}
