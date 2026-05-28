'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Sun, MapPin, Zap, User, Mail, Phone, Calendar,
  Loader2, AlertTriangle, ExternalLink, Activity,
} from 'lucide-react';
import { useSolarSystem, usePatch } from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import {
  SOLAR_SYSTEM_STATUS,
  getSolarSystemStatusConfig,
} from '@/lib/solar-system-status';

const DEVICE_STATUS: Record<string, { label: string; className: string }> = {
  online:      { label: 'Online',      className: 'text-solar-500 bg-solar-500/10' },
  offline:     { label: 'Offline',     className: 'text-destructive bg-destructive/10' },
  warning:     { label: 'Warning',     className: 'text-yellow-500 bg-yellow-500/10' },
  error:       { label: 'Error',       className: 'text-destructive bg-destructive/10' },
  maintenance: { label: 'Maintenance', className: 'text-orange-500 bg-orange-500/10' },
};

interface SystemDetailPageProps {
  systemId: string;
}

type ClientRef = { firstName?: string; lastName?: string; email?: string; phone?: string };
type DeviceRef = {
  _id: string;
  name: string;
  type: string;
  status: string;
  serialNumber?: string;
  lastSeenAt?: string;
};

/** Populated docs use `_id`; unpopulated refs may be strings or `{ id }` only. */
function normalizeDevices(raw: unknown): DeviceRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index) => {
    if (typeof entry === 'string') {
      return {
        _id: entry,
        name: 'Linked device',
        type: 'inverter',
        status: 'offline',
      };
    }
    if (entry && typeof entry === 'object') {
      const d = entry as DeviceRef & { id?: string };
      const id = d._id ?? d.id;
      return {
        ...d,
        _id: id != null ? String(id) : `device-${index}`,
        name: d.name ?? 'Device',
        type: d.type ?? 'inverter',
        status: d.status ?? 'offline',
      };
    }
    return {
      _id: `device-${index}`,
      name: 'Device',
      type: 'inverter',
      status: 'offline',
    };
  });
}
type SystemDetail = {
  _id: string;
  name: string;
  status: string;
  systemSizeKw: number;
  installedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  location?: {
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  clientId?: ClientRef;
  quotationId?: { _id: string; status?: string };
  devices?: DeviceRef[];
  metadata?: Record<string, unknown>;
};

export function SystemDetailPage({ systemId }: SystemDetailPageProps) {
  const { data, isLoading, isError, refetch } = useSolarSystem(systemId);
  const statusMutation = usePatch<{ status: string }, unknown>([['systems'], ['systems', systemId]]);

  const system = data as SystemDetail | undefined;
  const statusCfg = getSolarSystemStatusConfig(system?.status ?? 'planning');
  const devices = normalizeDevices(system?.devices);
  const onlineDevices = devices.filter((d) => d.status === 'online').length;

  async function onStatusChange(next: string) {
    if (!system || next === system.status) return;
    await statusMutation.mutateAsync({
      url: `/api/v1/solar-systems/${systemId}/status`,
      data: { status: next },
    });
    refetch();
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !system) {
    return (
      <PageContainer>
        <Link
          href="/systems"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to systems
        </Link>
        <div className="panel-card p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="font-medium">System not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This installation may have been removed or you do not have access.
          </p>
        </div>
      </PageContainer>
    );
  }

  const client = system.clientId;
  const clientName = client
    ? [client.firstName, client.lastName].filter(Boolean).join(' ') || '—'
    : '—';
  const mapsUrl =
    system.location?.latitude != null && system.location?.longitude != null
      ? `https://www.google.com/maps?q=${system.location.latitude},${system.location.longitude}`
      : null;

  return (
    <PageContainer>
      <Link
        href="/systems"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Solar Systems
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-solar-500/10 shrink-0">
            <Sun className="w-7 h-7 text-solar-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{system.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {[system.location?.city, system.location?.province].filter(Boolean).join(', ') || 'No location'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              statusCfg.color,
              'bg-current/10',
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
            {statusCfg.label}
          </div>
          <select
            value={system.status}
            disabled={statusMutation.isPending}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40 disabled:opacity-50"
            aria-label="Update system status"
          >
            {SOLAR_SYSTEM_STATUS.map((s) => (
              <option key={s} value={s}>
                {getSolarSystemStatusConfig(s).label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Capacity', value: `${system.systemSizeKw} kW`, icon: <Zap className="w-4 h-4 text-energy-400" /> },
          { label: 'Devices', value: `${onlineDevices}/${devices.length} online`, icon: <Activity className="w-4 h-4 text-solar-500" /> },
          {
            label: 'Installed',
            value: system.installedAt ? formatDate(system.installedAt) : 'Not yet',
            icon: <Calendar className="w-4 h-4 text-muted-foreground" />,
          },
          {
            label: 'Created',
            value: system.createdAt ? formatDate(system.createdAt) : '—',
            icon: <Calendar className="w-4 h-4 text-muted-foreground" />,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              {kpi.icon}
              <span className="text-xs">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 panel-card p-6"
        >
          <h2 className="text-sm font-semibold mb-4">Linked devices</h2>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No devices linked to this system yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {devices.map((device, index) => {
                const ds = DEVICE_STATUS[device.status] ?? DEVICE_STATUS.offline;
                const deviceId = device._id || `device-${index}`;
                return (
                  <li
                    key={deviceId}
                    className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/devices/${deviceId}`}
                        className="font-medium text-sm truncate hover:text-solar-500 transition-colors"
                      >
                        {device.name}
                      </Link>
                      <p className="text-xs text-muted-foreground capitalize">
                        {device.type?.replace('_', ' ')}
                        {device.serialNumber ? ` · ${device.serialNumber}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', ds.className)}>
                        {ds.label}
                      </span>
                      {device.lastSeenAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(device.lastSeenAt)}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/devices"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-solar-500 hover:underline"
          >
            Manage devices <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel-card p-6"
          >
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" /> Location
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="mt-0.5">{system.location?.address ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">City / Province</dt>
                <dd className="mt-0.5">
                  {[system.location?.city, system.location?.province].filter(Boolean).join(', ') || '—'}
                </dd>
              </div>
              {system.location?.latitude != null && (
                <div>
                  <dt className="text-xs text-muted-foreground">Coordinates</dt>
                  <dd className="mt-0.5 font-mono text-xs">
                    {system.location.latitude.toFixed(5)}, {system.location.longitude?.toFixed(5)}
                  </dd>
                </div>
              )}
            </dl>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-solar-500 hover:underline"
              >
                Open in Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="panel-card p-6"
          >
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" /> Client
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="mt-0.5 font-medium">{clientName}</dd>
              </div>
              {client?.email && (
                <div>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </dt>
                  <dd className="mt-0.5 break-all">{client.email}</dd>
                </div>
              )}
              {client?.phone && (
                <div>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </dt>
                  <dd className="mt-0.5">{client.phone}</dd>
                </div>
              )}
            </dl>
          </motion.div>

          {system.quotationId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="panel-card p-6"
            >
              <h2 className="text-sm font-semibold mb-2">Quotation</h2>
              <p className="text-xs text-muted-foreground capitalize mb-3">
                Status: {system.quotationId.status ?? '—'}
              </p>
              <Link
                href="/quotations"
                className="text-sm text-solar-500 hover:underline inline-flex items-center gap-1"
              >
                View quotations <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {system.updatedAt && (
        <p className="text-xs text-muted-foreground text-right">
          Last updated {formatDateTime(system.updatedAt)}
        </p>
      )}
    </PageContainer>
  );
}
