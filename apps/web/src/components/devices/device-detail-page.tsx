'use client';

import Link from 'next/link';
import type { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Zap, Wifi, WifiOff, Battery, Thermometer, Activity,
  Loader2, AlertTriangle, Sun, ExternalLink, Cpu, Hash, Radio, Gauge, TerminalSquare, UploadCloud,
} from 'lucide-react';
import { useDevice, usePatch, usePost, useTelemetryLatest } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';
import { PageContainer } from '@/components/layout/page-container';
import { formatDate, formatDateTime, formatPower, cn } from '@/lib/utils';
import {
  DEVICE_STATUSES,
  getDeviceStatusConfig,
  formatDeviceType,
} from '@/lib/device-status';
import { DeviceConnectPanel } from './device-connect-panel';

const TYPE_ICONS: Record<string, typeof Zap> = {
  inverter: Zap,
  battery: Battery,
  smart_meter: Activity,
  weather_sensor: Thermometer,
  ev_charger: Zap,
  esp32: Wifi,
  raspberry_pi: Wifi,
};

interface DeviceDetailPageProps {
  deviceId: string;
}

type SolarSystemRef = { _id: string; name: string; status?: string; systemSizeKw?: number };

type DeviceDetail = {
  _id: string;
  name: string;
  type: string;
  status: string;
  serialNumber: string;
  firmware?: string;
  macAddress?: string;
  ipAddress?: string;
  mqttClientId: string;
  organizationId?: string | { _id: string };
  lastSeenAt?: string;
  createdAt?: string;
  updatedAt?: string;
  location?: { latitude?: number; longitude?: number };
  metadata?: Record<string, unknown>;
  solarSystemId?: SolarSystemRef | string;
};

function orgIdOf(ref: DeviceDetail['organizationId']): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'string') return ref;
  return String(ref._id);
}

function systemIdOf(ref: DeviceDetail['solarSystemId']): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'string') return ref;
  return ref._id;
}

export function DeviceDetailPage({ deviceId }: DeviceDetailPageProps) {
  const authOrgId = useAuthStore((s) => s.user?.organizationId ?? s.user?.id);
  const { data, isLoading, isError, error, refetch } = useDevice(deviceId);
  const statusMutation = usePatch<{ status: string }, unknown>([['devices'], ['devices', deviceId]]);
  const firmwareMutation = usePost<{ version: string; immediate?: boolean }, { sent: boolean; targetVersion: string }>(
    `/api/v1/devices/${deviceId}/firmware`,
    [['devices'], ['devices', deviceId]],
  );
  const diagnosticsMutation = usePost<{ deep?: boolean }, {
    healthScore: number;
    checks: Array<{ check: string; ok: boolean; details: string }>;
    suggestedActions: string[];
  }>(`/api/v1/devices/${deviceId}/diagnostics`, [['devices'], ['devices', deviceId]]);
  const { data: latestRaw } = useTelemetryLatest(deviceId);

  const device = data as DeviceDetail | undefined;
  const statusCfg = getDeviceStatusConfig(device?.status ?? 'offline');
  const TypeIcon = TYPE_ICONS[device?.type ?? ''] ?? Zap;
  const linkedSystem =
    device?.solarSystemId && typeof device.solarSystemId === 'object'
      ? device.solarSystemId
      : null;
  const systemId = systemIdOf(device?.solarSystemId);
  const organizationId = orgIdOf(device?.organizationId) ?? authOrgId;

  async function onStatusChange(next: string) {
    if (!device || next === device.status) return;
    await statusMutation.mutateAsync({
      url: `/api/v1/devices/${deviceId}/status`,
      data: { status: next },
    });
    refetch();
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !device) {
    const httpStatus = (error as AxiosError | null)?.response?.status;
    const forbidden = httpStatus === 403;
    const notFound = httpStatus === 404;
    return (
      <PageContainer>
        <Link
          href="/devices"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to devices
        </Link>
        <div className="panel-card p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="font-medium">
            {forbidden ? 'Access denied' : notFound ? 'Device not found' : 'Could not load device'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {forbidden
              ? 'You do not have permission to view this device.'
              : 'It may have been removed or the API is unavailable.'}
          </p>
        </div>
      </PageContainer>
    );
  }

  const mapsUrl =
    device.location?.latitude != null && device.location?.longitude != null
      ? `https://www.google.com/maps?q=${device.location.latitude},${device.location.longitude}`
      : null;

  const metadataEntries = Object.entries(device.metadata ?? {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  const latest = latestRaw?.metrics ?? {};

  return (
    <PageContainer>
      <Link
        href="/devices"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Devices & IoT
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-accent shrink-0">
            <TypeIcon className="w-7 h-7 text-solar-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{device.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">
              {formatDeviceType(device.type)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{device.serialNumber}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              statusCfg.text,
              statusCfg.bg,
            )}
          >
            {device.status === 'online' ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {statusCfg.label}
          </span>
          <select
            value={device.status}
            disabled={statusMutation.isPending}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40 disabled:opacity-50"
            aria-label="Update device status"
          >
            {DEVICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getDeviceStatusConfig(s).label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Firmware', value: device.firmware ?? '1.0.0', icon: <Cpu className="w-4 h-4 text-muted-foreground" /> },
          {
            label: 'Last seen',
            value: device.lastSeenAt ? formatDateTime(device.lastSeenAt) : 'Never',
            icon: <Radio className="w-4 h-4 text-muted-foreground" />,
          },
          { label: 'MAC address', value: device.macAddress ?? '—', icon: <Hash className="w-4 h-4 text-muted-foreground" /> },
          { label: 'IP address', value: device.ipAddress ?? '—', icon: <Wifi className="w-4 h-4 text-muted-foreground" /> },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              {kpi.icon}
              <span className="text-xs">{kpi.label}</span>
            </div>
            <p className="text-sm font-semibold mt-2 break-all">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-card p-6"
        >
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-solar-500" /> Firmware management
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            Current firmware: <span className="text-foreground font-medium">{device.firmware ?? '1.0.0'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {['1.0.1', '1.1.0', '2.0.0'].map((version) => (
              <button
                key={version}
                type="button"
                disabled={firmwareMutation.isPending}
                onClick={() => firmwareMutation.mutate({ version, immediate: true })}
                className="px-3 py-1.5 rounded-lg text-xs bg-accent hover:bg-accent/80 disabled:opacity-50"
              >
                Deploy {version}
              </button>
            ))}
          </div>
          {firmwareMutation.data?.sent && (
            <p className="text-xs text-solar-500 mt-3">
              Firmware rollout command sent to {firmwareMutation.data.targetVersion}.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-card p-6"
        >
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TerminalSquare className="w-4 h-4 text-cyan-400" /> Remote diagnostics
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={diagnosticsMutation.isPending}
              onClick={() => diagnosticsMutation.mutate({ deep: false })}
              className="px-3 py-1.5 rounded-lg text-xs bg-accent hover:bg-accent/80 disabled:opacity-50"
            >
              Run standard
            </button>
            <button
              type="button"
              disabled={diagnosticsMutation.isPending}
              onClick={() => diagnosticsMutation.mutate({ deep: true })}
              className="px-3 py-1.5 rounded-lg text-xs bg-accent hover:bg-accent/80 disabled:opacity-50"
            >
              Run deep
            </button>
          </div>
          {diagnosticsMutation.data && (
            <div className="mt-4 text-sm">
              <p className="font-medium flex items-center gap-2">
                <Gauge className="w-4 h-4 text-solar-500" /> Health score {diagnosticsMutation.data.healthScore}%
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {diagnosticsMutation.data.checks.map((c) => (
                  <li key={c.check}>
                    <span className={c.ok ? 'text-solar-500' : 'text-destructive'}>{c.ok ? 'OK' : 'Issue'}</span>
                    {' '}· {c.check}: {c.details}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>

      {organizationId ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-card p-6"
        >
          <DeviceConnectPanel
            organizationId={organizationId}
            solarSystemId={device.solarSystemId}
            mqttClientId={device.mqttClientId}
            deviceType={device.type}
          />
        </motion.div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 panel-card p-6"
        >
          <h2 className="text-sm font-semibold mb-4">Device record</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">MQTT client ID</dt>
              <dd className="mt-0.5 font-mono text-xs break-all">{device.mqttClientId}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Serial number</dt>
              <dd className="mt-0.5 font-mono">{device.serialNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Registered</dt>
              <dd className="mt-0.5">{device.createdAt ? formatDateTime(device.createdAt) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last updated</dt>
              <dd className="mt-0.5">{device.updatedAt ? formatDateTime(device.updatedAt) : '—'}</dd>
            </div>
          </dl>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-solar-500 hover:underline"
            >
              View device location <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-3">Live telemetry snapshot</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-accent/50 p-2.5">
                <p className="text-muted-foreground">Output</p>
                <p className="font-semibold mt-1">{formatPower(Number(latest.powerOutputW ?? 0))}</p>
              </div>
              <div className="rounded-lg bg-accent/50 p-2.5">
                <p className="text-muted-foreground">Load</p>
                <p className="font-semibold mt-1">{formatPower(Number(latest.loadPowerW ?? 0))}</p>
              </div>
              <div className="rounded-lg bg-accent/50 p-2.5">
                <p className="text-muted-foreground">Battery</p>
                <p className="font-semibold mt-1">
                  {latest.batteryStateOfCharge != null || latest.batteryLevelPercent != null
                    ? `${Math.round(Number(latest.batteryStateOfCharge ?? latest.batteryLevelPercent))}%`
                    : '—'}
                </p>
              </div>
              <div className="rounded-lg bg-accent/50 p-2.5">
                <p className="text-muted-foreground">Grid</p>
                <p className="font-semibold mt-1">{formatPower(Number(latest.gridPowerW ?? 0))}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {linkedSystem && systemId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel-card p-6"
            >
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Sun className="w-4 h-4 text-solar-500" /> Linked system
              </h2>
              <p className="font-medium">{linkedSystem.name}</p>
              {linkedSystem.systemSizeKw != null && (
                <p className="text-sm text-muted-foreground mt-1">{linkedSystem.systemSizeKw} kW</p>
              )}
              {linkedSystem.status && (
                <p className="text-xs text-muted-foreground mt-1 capitalize">Status: {linkedSystem.status}</p>
              )}
              <Link
                href={`/systems/${systemId}`}
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-solar-500 hover:underline"
              >
                View system <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}

          {metadataEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="panel-card p-6"
            >
              <h2 className="text-sm font-semibold mb-4">Metadata</h2>
              <dl className="space-y-2 text-sm">
                {metadataEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd className="font-medium text-right break-all">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
