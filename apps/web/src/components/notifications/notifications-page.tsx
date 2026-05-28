'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Loader2, Mail, Smartphone, AppWindow, MessageSquare } from 'lucide-react';
import { useNotificationPreferences, useNotifications, usePatch, usePost } from '@/hooks/use-api';
import { formatDate } from '@/lib/utils';
import { PageContainer } from '@/components/layout/page-container';

type NotificationRow = {
  _id: string;
  title: string;
  body: string;
  event: string;
  channel: string;
  isRead: boolean;
  createdAt?: string;
};

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'sms' | 'push' | 'in_app'>('all');
  const { data, isLoading, isError } = useNotifications(page);
  const { data: prefs } = useNotificationPreferences();
  const markRead = usePatch<Record<string, never>, unknown>([['notifications']]);
  const markAll = usePatch<Record<string, never>, unknown>([['notifications']]);
  const updatePrefs = usePatch<any, unknown>([['notifications', 'preferences']]);
  const triggerEvent = usePost<any, unknown>('/api/v1/notifications/events/fault_alert', [['notifications']]);

  const rows: NotificationRow[] = Array.isArray((data as { data?: NotificationRow[] })?.data)
    ? (data as { data: NotificationRow[] }).data
    : [];
  const filteredRows = channelFilter === 'all' ? rows : rows.filter((r) => r.channel === channelFilter);
  const unread = (data as { unreadCount?: number })?.unreadCount ?? 0;
  const total = (data as { total?: number })?.total ?? 0;
  const limit = (data as { limit?: number })?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            disabled={markAll.isPending}
            onClick={() => markAll.mutateAsync({ url: '/api/v1/notifications/read-all', data: {} })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-50"
          >
            {markAll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark all read
          </button>
        )}
      </div>

      <div className="panel-card p-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'email', 'sms', 'push', 'in_app'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannelFilter(c)}
                className={`text-xs px-2.5 py-1 rounded-lg border ${channelFilter === c ? 'bg-solar-500/15 border-solar-500/30 text-solar-400' : 'border-border hover:bg-accent'}`}
              >
                {c.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              triggerEvent.mutateAsync({
                channels: ['in_app', 'push'],
                variables: { deviceName: 'Demo Inverter A1' },
              })
            }
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
          >
            Trigger fault alert (demo)
          </button>
        </div>
        {!!prefs && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
            {(
              [
                ['email', prefs.channels.email, Mail],
                ['sms', prefs.channels.sms, MessageSquare],
                ['push', prefs.channels.push, Smartphone],
                ['in_app', prefs.channels.in_app, AppWindow],
              ] as const
            ).map(([key, enabled, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  updatePrefs.mutateAsync({
                    url: '/api/v1/notifications/preferences/me',
                    data: { channels: { [key]: !enabled } },
                  })
                }
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${enabled ? 'border-solar-500/30 bg-solar-500/10' : 'border-border bg-accent/40'}`}
              >
                <span className="flex items-center gap-1.5 capitalize"><Icon className="w-3.5 h-3.5" />{key.replace('_', ' ')}</span>
                <span>{enabled ? 'On' : 'Off'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panel-card overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        {isError && (
          <p className="p-8 text-center text-sm text-destructive">Could not load notifications.</p>
        )}
        {!isLoading && !isError && filteredRows.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        )}
        {!isLoading && !isError && filteredRows.length > 0 && (
          <ul className="divide-y divide-border">
            {filteredRows.map((n) => (
              <motion.li
                key={n._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 flex gap-3 ${n.isRead ? 'opacity-80' : 'bg-solar-500/5'}`}
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Bell className={`w-4 h-4 ${n.isRead ? 'text-muted-foreground' : 'text-solar-400'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {n.event} · {n.channel}
                    {n.createdAt ? ` · ${formatDate(n.createdAt)}` : ''}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    type="button"
                    title="Mark read"
                    disabled={markRead.isPending}
                    onClick={() =>
                      markRead.mutateAsync({ url: `/api/v1/notifications/${n._id}/read`, data: {} })
                    }
                    className="shrink-0 self-start p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground self-center px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </PageContainer>
  );
}
