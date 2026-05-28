'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Wifi,
  WifiOff,
  Battery,
  Thermometer,
  Activity,
  Plus,
  AlertTriangle,
  Gauge,
  Router,
  Cpu,
  MapPin,
  BellRing,
  ShieldCheck,
} from 'lucide-react';
import { useDevices, useIotOverview } from '@/hooks/use-api';
import { formatDate, cn, formatPower } from '@/lib/utils';
import { getDeviceStatusConfig, formatDeviceType } from '@/lib/device-status';
import { AddDeviceModal } from './add-device-modal';
import { PageContainer } from '@/components/layout/page-container';

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  inverter:      <Zap className="w-5 h-5 text-yellow-400" />,
  battery:       <Battery className="w-5 h-5 text-purple-400" />,
  smart_meter:   <Activity className="w-5 h-5 text-energy-400" />,
  weather_sensor:<Thermometer className="w-5 h-5 text-blue-400" />,
  esp32:         <Wifi className="w-5 h-5 text-green-400" />,
  raspberry_pi:  <Wifi className="w-5 h-5 text-red-400" />,
};

export function DevicesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [windowHours, setWindowHours] = useState(24);
  const { data: devicesRaw, isLoading } = useDevices();
  const { data: overview } = useIotOverview(windowHours);
  const devices: any[] = Array.isArray(devicesRaw) ? devicesRaw : [];

  const filtered = filter === 'all' ? devices : devices.filter((d) => d.type === filter || d.status === filter);

  const onlineCount  = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline' || d.status === 'error').length;

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">IoT Monitoring App</h1>
          <p className="text-sm text-muted-foreground">Device registration, telemetry, alerts, GPS, and diagnostics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={windowHours}
            onChange={(e) => setWindowHours(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-accent border border-border text-sm"
            aria-label="Telemetry time window"
          >
            <option value={6}>6h</option>
            <option value={24}>24h</option>
            <option value={72}>72h</option>
            <option value={168}>7d</option>
          </select>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90 shadow-glow">
            <Plus className="w-4 h-4" /> Register Device
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Devices', value: devices.length,     color: '' },
          { label: 'Online',        value: onlineCount,        color: 'text-solar-500' },
          { label: 'Offline/Error', value: offlineCount,       color: 'text-destructive' },
          { label: 'Inverters',     value: devices.filter((d) => d.type === 'inverter').length, color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Device health dashboard */}
      {overview && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 panel-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" /> Device Health Dashboard
              </h2>
              <span className="text-xs text-muted-foreground">
                Avg health: <span className="text-foreground font-medium">{overview.totals.avgHealthScore}%</span>
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Online', value: overview.totals.online, color: 'text-solar-500' },
                { label: 'Warnings', value: overview.totals.warning, color: 'text-yellow-400' },
                { label: 'Offline', value: overview.totals.offline, color: 'text-destructive' },
                { label: 'Devices', value: overview.totals.total, color: 'text-foreground' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-accent/50 p-3">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: Cpu, title: 'Firmware management', body: 'Push firmware updates to ESP32, Raspberry Pi, inverters, and meters.' },
                { icon: Router, title: 'MQTT support', body: 'Bi-directional command & telemetry topics with live health scoring.' },
                { icon: ShieldCheck, title: 'Remote diagnostics', body: 'Run quick/deep diagnostics with actionable recommendations.' },
              ].map((f) => (
                <div key={f.title} className="rounded-lg bg-accent/40 border border-border p-3">
                  <f.icon className="w-4 h-4 text-solar-500 mb-2" />
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{f.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" /> Real-time Alerts
            </h2>
            <div className="space-y-2">
              {overview.alerts.slice(0, 4).map((a) => (
                <div key={a.id} className="rounded-lg bg-accent/50 p-3">
                  <p className="text-sm font-medium line-clamp-1">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.body}</p>
                </div>
              ))}
              {!overview.alerts.length && (
                <p className="text-xs text-muted-foreground">No new IoT alerts in this window.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {overview && (
        <div className="panel-card p-5">
          <h2 className="font-semibold mb-3">Supported Hardware</h2>
          <div className="flex flex-wrap gap-2">
            {overview.supportedHardware.map((h) => (
              <span key={h} className="text-xs px-2.5 py-1 rounded-full bg-accent text-muted-foreground">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'online', 'offline', 'inverter', 'battery', 'smart_meter'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              filter === f ? 'bg-solar-500/20 text-solar-500' : 'bg-accent text-muted-foreground hover:text-foreground',
            )}>
            {f.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Device grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-accent/50 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel-card p-12 text-center">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="font-medium">No devices found</p>
          <p className="text-sm text-muted-foreground mt-1">Register your first IoT device</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((device) => {
            const st = getDeviceStatusConfig(device.status);
            const io = overview?.devices.find((d) => d.id === device._id);
            const statusIcon =
              device.status === 'warning' || device.status === 'error' ? (
                <AlertTriangle className="w-3 h-3" />
              ) : device.status === 'online' ? (
                <Wifi className="w-3 h-3" />
              ) : device.status === 'maintenance' ? (
                <Activity className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              );
            return (
              <Link key={device._id} href={`/devices/${device._id}`} className="block">
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="interactive-card p-5 rounded-xl h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-accent">
                    {DEVICE_ICONS[device.type] ?? <Zap className="w-5 h-5" />}
                  </div>
                  <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', st.text, st.bg)}>
                    {statusIcon} {st.label}
                  </span>
                </div>

                <h3 className="font-semibold text-sm truncate">{device.name}</h3>
                <p className="text-xs text-muted-foreground">{formatDeviceType(device.type)}</p>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-border text-xs">
                  <div>
                    <p className="text-muted-foreground">Serial</p>
                    <p className="font-mono truncate">{device.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Firmware</p>
                    <p>{device.firmware}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">MQTT ID</p>
                    <p className="font-mono truncate">{device.mqttClientId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Seen</p>
                    <p>{device.lastSeenAt ? formatDate(device.lastSeenAt) : 'Never'}</p>
                  </div>
                </div>
                {io && (
                  <div className="mt-3 rounded-lg bg-accent/50 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Health</span>
                      <span className="font-semibold">{io.healthScore}%</span>
                    </div>
                    <div className="h-1.5 bg-background/70 rounded mt-1.5 overflow-hidden">
                      <div className="h-full bg-solar-500" style={{ width: `${io.healthScore}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <p className="text-muted-foreground">Power</p>
                        <p className="font-medium">{formatPower(io.latestMetrics.powerOutputW)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Battery</p>
                        <p className="font-medium">
                          {io.latestMetrics.batteryStateOfCharge != null ? `${Math.round(io.latestMetrics.batteryStateOfCharge)}%` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Temp</p>
                        <p className="font-medium">
                          {io.latestMetrics.temperatureCelsius != null ? `${Math.round(io.latestMetrics.temperatureCelsius)}°C` : '—'}
                        </p>
                      </div>
                    </div>
                    {io.location?.latitude != null && io.location?.longitude != null && (
                      <div className="mt-2 text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        GPS tracked
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      {showAdd && <AddDeviceModal onClose={() => setShowAdd(false)} />}
    </PageContainer>
  );
}
