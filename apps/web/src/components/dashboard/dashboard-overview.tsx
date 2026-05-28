'use client';

import { useMemo } from 'react';
import type { UserRole } from '@solartech/shared';
import { motion } from 'framer-motion';
import {
  Zap, Sun, DollarSign, Battery,
  AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  useAnalyticsDashboard,
  useDevices,
  useNotifications,
  useTodayHourly,
} from '@/hooks/use-api';
import { formatKwh, formatPower, formatCurrency, formatNumber } from '@/lib/utils';
import { formatMonthLabel, formatRelativeTime } from '@/lib/analytics-range';
import { RealtimeTelemetryWidget } from './realtime-telemetry-widget';
import { PageContainer } from '@/components/layout/page-container';

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0 },
};
const STAGGER = { show: { transition: { staggerChildren: 0.07 } } };

interface Props {
  role: UserRole;
}

export function DashboardOverview({ role: _role }: Props) {
  const { data: dashboard } = useAnalyticsDashboard();
  const { data: todayHourly } = useTodayHourly();
  const { data: notifications } = useNotifications(1);
  const { data: devicesRaw } = useDevices();

  const devices: Array<{ _id?: string; id?: string; type?: string }> = Array.isArray(devicesRaw) ? devicesRaw : [];
  const primaryInverter = devices.find((d) => d.type === 'inverter');
  const deviceId = primaryInverter?._id ?? primaryInverter?.id ?? '';

  const productionData = useMemo(() => {
    const hours = todayHourly ?? [];
    if (hours.length === 0) return [];
    return hours.map((h: { _id: number; production?: number; consumption?: number }) => {
      const label = h._id === 0 ? '12am' : h._id < 12 ? `${h._id}am` : h._id === 12 ? '12pm' : `${h._id - 12}pm`;
      return {
        time: label,
        production: Math.round((h.production ?? 0) / 1000 * 10) / 10,
        consumption: Math.round((h.consumption ?? 0) / 1000 * 10) / 10,
      };
    });
  }, [todayHourly]);

  const monthlyData = useMemo(() => {
    const revenue = dashboard?.revenue ?? [];
    const production = dashboard?.monthlyProduction ?? [];
    const prodMap = new Map(production.map((p: { _id: string; production: number }) => [p._id, p.production]));

    return revenue.map((r: { _id: string; revenue: number }) => ({
      month: formatMonthLabel(r._id),
      savings: Math.round(r.revenue),
      production: Math.round(prodMap.get(r._id) ?? 0),
    }));
  }, [dashboard]);

  const alerts = useMemo(() => {
    const list = notifications?.data ?? [];
    return list.slice(0, 4).map((n: { title: string; body: string; createdAt?: string; event: string }) => ({
      type: n.event.includes('warn') || n.event.includes('offline') ? 'warning' as const : 'ok' as const,
      msg: n.title || n.body,
      time: formatRelativeTime(n.createdAt ?? new Date()),
    }));
  }, [notifications]);

  const live = dashboard?.live;
  const systems = dashboard?.systems;
  const thisMonthRevenue = dashboard?.revenue?.[dashboard.revenue.length - 1]?.revenue ?? 0;
  const prevMonthRevenue = dashboard?.revenue?.[dashboard.revenue.length - 2]?.revenue ?? 0;
  const revenueTrend = prevMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 1000) / 10
    : 0;

  const stats = [
    {
      label: 'Live Output',
      value: formatPower(live?.powerOutputW ?? 0),
      sub: 'Current production',
      icon: <Zap className="w-5 h-5" />,
      trend: 0,
      color: 'text-solar-500',
    },
    {
      label: "Today's Energy",
      value: formatKwh(live?.energyTodayKwh ?? 0),
      sub: `${systems?.active ?? 0} active systems`,
      icon: <Sun className="w-5 h-5" />,
      trend: 0,
      color: 'text-yellow-400',
    },
    {
      label: 'Monthly Savings',
      value: formatCurrency(thisMonthRevenue),
      sub: 'Paid invoices this month',
      icon: <DollarSign className="w-5 h-5" />,
      trend: revenueTrend,
      color: 'text-energy-400',
    },
    {
      label: 'Battery',
      value: live?.batterySoc != null ? `${Math.round(live.batterySoc)}%` : '—',
      sub: live?.batterySoc != null ? 'State of charge' : 'No battery telemetry',
      icon: <Battery className="w-5 h-5" />,
      trend: 0,
      color: 'text-purple-400',
    },
  ];

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Energy Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live overview · {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <SystemStatusBadge
          status={(systems?.active ?? 0) > 0 ? 'online' : 'offline'}
          systemCount={systems?.total ?? 0}
        />
      </div>

      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={FADE_UP} className="stat-card">
            <div className="flex items-center justify-between">
              <span className={`p-2 rounded-lg bg-current/10 ${stat.color}`}>
                <span className={stat.color}>{stat.icon}</span>
              </span>
              {stat.trend !== 0 && <TrendBadge trend={stat.trend} />}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 panel-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Production vs Consumption</h2>
              <p className="text-xs text-muted-foreground">Today (kW)</p>
            </div>
            <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full">Live</span>
          </div>
          {productionData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">No hourly telemetry for today yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={productionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="production" name="Production" stroke="#22c55e" fill="url(#prodGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="consumption" name="Consumption" stroke="#3b82f6" fill="url(#consGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <RealtimeTelemetryWidget deviceId={deviceId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 panel-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Monthly Savings & Production</h2>
              <p className="text-xs text-muted-foreground">From invoices and telemetry</p>
            </div>
          </div>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No monthly data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="savings" name="Savings (₱)" fill="#22c55e" radius={[4,4,0,0]} />
                <Bar dataKey="production" name="Production (kWh)" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate="show"
          className="panel-card p-5"
        >
          <h2 className="text-sm font-semibold mb-4">System Alerts</h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent notifications.</p>
            ) : alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                {alert.type === 'warning'
                  ? <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  : <CheckCircle2 className="w-4 h-4 text-solar-500 flex-shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-snug">{alert.msg}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}

function TrendBadge({ trend }: { trend: number }) {
  const up = trend >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-solar-500' : 'text-destructive'}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(trend)}%
    </span>
  );
}

function SystemStatusBadge({ status, systemCount }: { status: string; systemCount: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-solar-500/10 border border-solar-500/20">
      <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-solar-500 animate-pulse' : 'bg-muted-foreground'}`} />
      <span className="text-xs font-medium text-solar-500">
        {formatNumber(systemCount)} systems {status}
      </span>
    </div>
  );
}
