import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';
import {
  NotificationPreference,
  NotificationPreferenceDocument,
} from '../../database/schemas/notification-preference.schema';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationEventKey =
  | 'fault_alert'
  | 'maintenance_reminder'
  | 'billing_notification'
  | 'proposal_approval'
  | 'energy_anomaly';

export interface SendNotificationOptions {
  userId: string;
  organizationId?: string;
  event: string;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  data?: Record<string, string>;
  email?: string;
  phone?: string;
  pushToken?: string;
}

@Injectable()
export class NotificationsService {
  private transporter?: nodemailer.Transporter;

  constructor(
    @InjectModel(Notification.name) private model: Model<NotificationDocument>,
    @InjectModel(NotificationPreference.name)
    private preferenceModel: Model<NotificationPreferenceDocument>,
    private config: ConfigService,
  ) {
    const user = config.get<string>('app.mail.user');
    if (user) {
      this.transporter = nodemailer.createTransport({
        host:   config.get<string>('app.mail.host'),
        port:   config.get<number>('app.mail.port'),
        secure: false,
        auth: { user, pass: config.get<string>('app.mail.password') },
      });
    }
  }

  async send(opts: SendNotificationOptions) {
    const prefs = await this.getPreferences(opts.userId);
    const requested = opts.channels ?? ['in_app'];
    const channels = requested.filter((ch) => prefs.channels[ch]);
    const results: NotificationDocument[] = [];

    for (const channel of channels) {
      const notif = await this.model.create({
        userId:         new Types.ObjectId(opts.userId),
        organizationId: opts.organizationId ? new Types.ObjectId(opts.organizationId) : undefined,
        event:   opts.event,
        channel,
        title:   opts.title,
        body:    opts.body,
        data:    opts.data ?? {},
        sentAt:  new Date(),
      });
      results.push(notif);

      if (channel === 'email' && opts.email && this.transporter) {
        await this.transporter.sendMail({
          from:    this.config.get('app.mail.from'),
          to:      opts.email,
          subject: opts.title,
          html:    this.buildEmailHtml(opts.title, opts.body),
        }).catch((e) => console.error('Email send error', e));
      }

      if (channel === 'sms' && opts.phone) {
        await this.sendSms(opts.phone, `${opts.title} — ${opts.body}`);
      }

      if (channel === 'push' && opts.pushToken) {
        await this.sendPush(opts.pushToken, opts.title, opts.body, opts.data);
      }
    }

    return results;
  }

  async getForUser(userId: string, page = 1, limit = 20) {
    const [data, total, unreadCount] = await Promise.all([
      this.model
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments({ userId: new Types.ObjectId(userId) }),
      this.model.countDocuments({ userId: new Types.ObjectId(userId), isRead: false }),
    ]);
    return { data, total, unreadCount, page, limit };
  }

  async markRead(id: string, userId: string) {
    return this.model.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
  }

  async markAllRead(userId: string) {
    return this.model.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getPreferences(userId: string) {
    const existing = await this.preferenceModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (existing) return existing;
    return this.preferenceModel.create({
      userId: new Types.ObjectId(userId),
    });
  }

  async updatePreferences(
    userId: string,
    patch: Partial<{
      channels: Partial<Record<NotificationChannel, boolean>>;
      events: Partial<Record<NotificationEventKey, boolean>>;
    }>,
  ) {
    const existing = await this.getPreferences(userId);
    return this.preferenceModel.findByIdAndUpdate(
      existing._id,
      {
        ...(patch.channels ? { channels: { ...existing.channels, ...patch.channels } } : {}),
        ...(patch.events ? { events: { ...existing.events, ...patch.events } } : {}),
      },
      { new: true },
    );
  }

  async dispatchEvent(opts: {
    eventKey: NotificationEventKey;
    userId: string;
    organizationId?: string;
    channels?: NotificationChannel[];
    email?: string;
    phone?: string;
    pushToken?: string;
    variables?: Record<string, string>;
  }) {
    const prefs = await this.getPreferences(opts.userId);
    if (!prefs.events[opts.eventKey]) {
      return { skipped: true, reason: 'Event disabled by user preferences' };
    }
    const template = this.eventTemplate(opts.eventKey, opts.variables);
    const channels = (opts.channels ?? ['in_app', 'push']).filter((ch) => prefs.channels[ch]);
    const sent = await this.send({
      userId: opts.userId,
      organizationId: opts.organizationId,
      event: opts.eventKey,
      title: template.title,
      body: template.body,
      channels,
      data: opts.variables,
      email: opts.email,
      phone: opts.phone,
      pushToken: opts.pushToken,
    });
    return { sent: sent.length, channels };
  }

  private eventTemplate(event: NotificationEventKey, vars?: Record<string, string>) {
    const v = vars ?? {};
    const templates: Record<NotificationEventKey, { title: string; body: string }> = {
      fault_alert: {
        title: 'Fault alert detected',
        body: v.deviceName
          ? `${v.deviceName} reported a critical fault. Review diagnostics immediately.`
          : 'A critical device fault was detected. Review diagnostics immediately.',
      },
      maintenance_reminder: {
        title: 'Maintenance reminder',
        body: v.ticket
          ? `Scheduled maintenance reminder: ${v.ticket}.`
          : 'You have upcoming preventive maintenance tasks.',
      },
      billing_notification: {
        title: 'Billing notice',
        body: v.invoice
          ? `Invoice ${v.invoice} is due soon.`
          : 'A billing update requires your attention.',
      },
      proposal_approval: {
        title: 'Proposal approved',
        body: v.proposal
          ? `Proposal ${v.proposal} has been approved.`
          : 'A customer proposal has been approved.',
      },
      energy_anomaly: {
        title: 'Energy anomaly detected',
        body: v.metric
          ? `Anomaly detected for ${v.metric}. Please inspect system behavior.`
          : 'An energy anomaly was detected in telemetry signals.',
      },
    };
    return templates[event];
  }

  private async sendSms(phone: string, message: string) {
    // Voice/SMS gateway adapter point (Twilio/Infobip/Semaphore/etc.)
    if (!phone) return;
    // eslint-disable-next-line no-console
    console.log(`[SMS MOCK] -> ${phone}: ${message}`);
  }

  private async sendPush(token: string, title: string, body: string, data?: Record<string, string>) {
    // Push adapter point (FCM/APNs/WebPush)
    if (!token) return;
    // eslint-disable-next-line no-console
    console.log(`[PUSH MOCK] -> ${token}: ${title} | ${body}`, data ?? {});
  }

  private buildEmailHtml(title: string, body: string): string {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; background: #f8fafc; padding: 40px 0;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
    <div style="background: linear-gradient(135deg, #22c55e, #3b82f6); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">SolarTech</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #0f172a; margin: 0 0 16px;">${title}</h2>
      <p style="color: #475569; line-height: 1.6;">${body}</p>
    </div>
    <div style="padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
        © ${new Date().getFullYear()} SolarTech · Smart Energy Ecosystem
      </p>
    </div>
  </div>
</body>
</html>`;
  }
}
