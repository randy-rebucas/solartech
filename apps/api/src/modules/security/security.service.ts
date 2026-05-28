import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AuditLog, AuditLogDocument } from '../../database/schemas/audit-log.schema';

@Injectable()
export class SecurityService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    private config: ConfigService,
  ) {}

  async logAudit(input: {
    userId?: string;
    organizationId?: string;
    action: string;
    route: string;
    method: string;
    statusCode: number;
    durationMs: number;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.auditLogModel.create({
      userId: input.userId ? new Types.ObjectId(input.userId) : undefined,
      organizationId: input.organizationId ? new Types.ObjectId(input.organizationId) : undefined,
      action: input.action,
      route: input.route,
      method: input.method,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      ip: input.ip,
      userAgent: input.userAgent,
      metadata: input.metadata ?? {},
    });
  }

  async listAuditLogs(page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.auditLogModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.auditLogModel.countDocuments(),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async runBackup(options?: { collections?: string[]; encrypt?: boolean }) {
    const db = this.connection.db;
    if (!db) throw new Error('Database connection is not ready');
    const names = options?.collections?.length
      ? options.collections
      : ['users', 'organizations', 'solar_systems', 'devices', 'telemetry', 'invoices', 'maintenance_tickets', 'notifications', 'audit_logs'];
    const encrypt = options?.encrypt ?? true;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = this.config.get<string>('app.security.backupDir') ?? 'backups';
    await mkdir(backupDir, { recursive: true });
    const extension = encrypt ? 'enc.json' : 'json';
    const path = join(backupDir, `backup-${timestamp}.${extension}`);

    const payload: Record<string, unknown> = { generatedAt: new Date().toISOString(), collections: {} };
    for (const name of names) {
      const col = db.collection(name);
      const docs = await col.find({}).limit(name === 'telemetry' ? 10000 : 5000).toArray();
      (payload.collections as Record<string, unknown[]>)[name] = docs;
    }
    const json = JSON.stringify(payload, null, 2);
    const checksum = createHash('sha256').update(json).digest('hex');

    if (!encrypt) {
      await writeFile(path, JSON.stringify({ ...payload, checksum }, null, 2), 'utf8');
      return { path, checksum, encrypted: false, collections: names };
    }

    const configuredKey = this.config.get<string>('app.security.encryptionKey') ?? 'dev-only-key-change-me';
    const key = createHash('sha256').update(configuredKey).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encryptedContent = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    await writeFile(
      path,
      JSON.stringify(
        {
          generatedAt: payload.generatedAt,
          encrypted: true,
          algorithm: 'aes-256-gcm',
          iv: iv.toString('base64'),
          authTag: authTag.toString('base64'),
          checksum,
          payload: encryptedContent.toString('base64'),
        },
        null,
        2,
      ),
      'utf8',
    );
    return { path, checksum, encrypted: true, collections: names };
  }
}

