'use client';

import Link from 'next/link';
import {
  Sun, Zap, Battery, CreditCard, Wrench, Bell, Leaf, DollarSign,
  TrendingUp, Activity, Lightbulb, ArrowRight, Plus, Gauge,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { ClientDashboard } from '@/hooks/use-api';
import { formatCurrency, formatKwh, formatPower, formatNumber } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/analytics-range';

export function ClientPortalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse max-w-3xl mx-auto">
      <div className="h-8 w-48 bg-accent rounded-lg" />
      <div className="h-40 rounded-2xl bg-accent" />
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 min-w-[140px] flex-1 rounded-xl bg-accent" />
        ))}
      </div>
      <div className="h-56 rounded-xl bg-accent" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 rounded-xl bg-accent" />
        <div className="h-32 rounded-xl bg-accent" />
      </div>
    </div>
  );
}

type LiveProps = {
  live: ClientDashboard['live'];
  system: ClientDashboard['primarySystem'];
};

export function LiveProductionHero({ live, system }: LiveProps) {
  return (
    <section
      id="production"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-solar-600/25 via-card to-emerald-600/10 border border-solar-500/25 p-5 sm:p-6 shadow-lg shadow-solar-500/5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-solar-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-solar-500 animate-pulse" aria-hidden />
            Live solar production
          </p>
          <p className="text-4xl sm:text-5xl font-bold mt-2 text-solar-300 tabular-nums tracking-tight">
            {formatPower(live.solarProductionW)}
          </p>
          <p className="text-sm text-muted-foreground mt-2 truncate">
            {system?.name ?? 'Your system'}
            {system ? ` · ${system.systemSizeKw} kW` : ''}
          </p>
          <p className="text-sm mt-1">
            <span className="text-muted-foreground">Today </span>
            <span className="font-semibold text-foreground">{formatKwh(live.energyTodayKwh)}</span>
            <span className="text-muted-foreground"> · Load </span>
            <span className="font-medium text-blue-400">{formatPower(live.loadDemandW)}</span>
          </p>
        </div>
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-solar-500/20 flex items-center justify-center shrink-0 ring-1 ring-solar-500/30">
          <Sun className="w-8 h-8 sm:w-9 sm:h-9 text-solar-400" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
        {[
          { label: 'Solar', value: formatPower(live.solarProductionW), accent: 'text-solar-400' },
          { label: 'Load', value: formatPower(live.loadDemandW), accent: 'text-blue-400' },
          { label: 'Grid', value: formatPower(live.gridImportW), accent: 'text-red-400' },
          {
            label: 'Battery in',
            value: formatPower(live.batteryChargeW),
            accent: 'text-purple-400',
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-background/50 backdrop-blur px-2.5 py-2.5 text-center border border-white/5">
            <p className={`text-sm font-bold tabular-nums ${item.accent}`}>{item.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
      {live.updatedAt && (
        <p className="text-[10px] text-muted-foreground mt-3 text-right">
          Updated {formatRelativeTime(live.updatedAt)}
          {live.deviceName ? ` · ${live.deviceName}` : ''}
        </p>
      )}
    </section>
  );
}

export function SavingsCarbonWidgets({
  trackers,
  forecastSavingsPhp,
}: {
  trackers: ClientDashboard['trackers'];
  forecastSavingsPhp?: number;
}) {
  const savings = trackers.savingsTracker;
  const carbon = trackers.carbonReductionTracker;

  return (
    <div id="impact" className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <article className="stat-card border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] uppercase tracking-wide text-emerald-500/80 font-medium">30 days</span>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
          {formatCurrency(savings.estimatedPhp)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Savings tracker</p>
        <p className="text-sm mt-2 text-foreground/80">
          {formatKwh(savings.totalKwh)} self-generated
        </p>
        {forecastSavingsPhp != null && (
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Forecast {formatCurrency(forecastSavingsPhp)} next month
          </p>
        )}
      </article>

      <article className="stat-card border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <Leaf className="w-5 h-5 text-green-400" />
          <span className="text-[10px] uppercase tracking-wide text-green-500/80 font-medium">Impact</span>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-green-400 tabular-nums">
          {formatNumber(carbon.totalKg)} kg
        </p>
        <p className="text-xs text-muted-foreground mt-1">CO₂ reduction</p>
        <p className="text-sm mt-2 text-foreground/80">
          ≈ {carbon.treesEquivalent} tree{carbon.treesEquivalent !== 1 ? 's' : ''} equivalent
        </p>
      </article>
    </div>
  );
}

export function BatteryMonitorPanel({ battery, live }: { battery: ClientDashboard['battery']; live: ClientDashboard['live'] }) {
  const soc = battery.stateOfCharge ?? live.batterySoc ?? 0;

  return (
    <section id="battery" className="panel-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <Battery className="w-4 h-4 text-purple-400" />
        Battery monitoring
      </h2>
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <div className="flex items-end gap-3">
            <p className="text-5xl font-bold tabular-nums">{soc > 0 ? `${Math.round(soc)}%` : '—'}</p>
            <span
              className={`text-xs px-2.5 py-1 rounded-full mb-2 font-medium capitalize ${
                battery.status === 'full'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : battery.status === 'low'
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-accent text-muted-foreground'
              }`}
            >
              {battery.charging ? '↑ Charging' : battery.status}
            </span>
          </div>
          <div className="mt-4 h-3 rounded-full bg-accent overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-violet-500 to-purple-400 transition-all duration-700"
              style={{ width: `${Math.min(100, soc)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Charge rate {formatPower(live.batteryChargeW)} when solar exceeds load
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-44 shrink-0">
          <div className="rounded-lg bg-accent/60 p-2.5 text-center">
            <Zap className="w-4 h-4 text-solar-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Solar</p>
            <p className="text-sm font-semibold">{formatPower(live.solarProductionW)}</p>
          </div>
          <div className="rounded-lg bg-accent/60 p-2.5 text-center">
            <Activity className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Load</p>
            <p className="text-sm font-semibold">{formatPower(live.loadDemandW)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductionAnalyticsPanel({
  chartData,
  monthlyChart,
  peakDemand,
}: {
  chartData: Array<{ time: string; production: number; consumption: number }>;
  monthlyChart: ClientDashboard['monthlyReports'];
  peakDemand: ClientDashboard['peakDemand'];
}) {
  const carbonTrend = monthlyChart.map((m) => ({ label: m.label, co2: m.co2Kg, savings: m.savingsPhp }));

  return (
    <div id="analytics" className="space-y-4">
      <section className="panel-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-solar-500" />
            Today&apos;s energy profile
          </h2>
          <span className="text-[10px] uppercase bg-accent px-2 py-0.5 rounded-full text-muted-foreground">kW</span>
        </div>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Waiting for today&apos;s telemetry…</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ left: -12, right: 4 }}>
              <defs>
                <linearGradient id="cp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="production" name="Solar" stroke="#f59e0b" fill="url(#cp)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="consumption" name="Load" stroke="#3b82f6" fill="url(#cc)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {peakDemand && (
          <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
            Typical peak load around <span className="text-foreground font-medium">{peakDemand.peakHour}:00</span>
            {' '}({formatPower(peakDemand.peakDemandW)})
          </p>
        )}
      </section>

      {monthlyChart.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="panel-card p-4 sm:p-5">
            <h3 className="text-sm font-semibold mb-3">Monthly production & savings</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyChart} margin={{ left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="productionKwh" name="kWh" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="savingsPhp" name="₱ saved" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
          <section className="panel-card p-4 sm:p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-400" />
              Carbon reduction trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={carbonTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="co2" name="kg CO₂" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
    </div>
  );
}

export function AiInsightsPanel({
  aiSummary,
  recommendations,
}: {
  aiSummary: ClientDashboard['aiSummary'];
  recommendations: string[];
}) {
  if (!aiSummary && !recommendations.length) return null;

  return (
    <section className="panel-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        AI recommendations
      </h2>
      {aiSummary && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 rounded-lg bg-accent/60 px-3 py-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-sm">
              Efficiency <strong>{aiSummary.efficiencyScore}</strong> ({aiSummary.efficiencyGrade})
            </span>
          </div>
          <div className="rounded-lg bg-accent/60 px-3 py-2 text-sm text-muted-foreground">
            ~{aiSummary.next24hConsumptionKwh} kWh load forecast (24h)
          </div>
        </div>
      )}
      <ul className="space-y-2">
        {recommendations.map((r, i) => (
          <li key={i} className="text-sm rounded-xl bg-accent/50 px-3 py-2.5 leading-relaxed border-l-2 border-solar-500/50">
            {r}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BillingOverviewPanel({ billing }: { billing: ClientDashboard['billing'] }) {
  return (
    <section id="billing" className="panel-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-500" />
          Billing overview
        </h2>
        <Link href="/billing" className="text-xs text-solar-500 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {billing.openCount > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 mb-3">
          <p className="text-sm font-medium text-amber-200">
            {billing.openCount} open invoice{billing.openCount !== 1 ? 's' : ''} · {formatCurrency(billing.totalDue)} due
          </p>
        </div>
      )}
      <ul className="space-y-2">
        {billing.recent.slice(0, 5).map((inv) => (
          <li key={inv.id} className="flex items-center justify-between gap-2 rounded-lg bg-accent/50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{inv.invoiceNumber}</p>
              <p className="text-xs text-muted-foreground capitalize">{inv.status}</p>
            </div>
            <p className="text-sm font-semibold shrink-0">{formatCurrency(inv.total)}</p>
          </li>
        ))}
        {!billing.recent.length && <p className="text-sm text-muted-foreground">No invoices yet.</p>}
      </ul>
    </section>
  );
}

export function MaintenancePanel({
  maintenance,
  onNewTicket,
}: {
  maintenance: ClientDashboard['maintenance'];
  onNewTicket: () => void;
}) {
  return (
    <section id="maintenance" className="panel-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Wrench className="w-4 h-4 text-orange-400" />
          Maintenance requests
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewTicket}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-solar-500 text-white font-medium min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
          <Link href="/maintenance" className="text-xs text-solar-500 hover:underline min-h-[36px] flex items-center">
            All
          </Link>
        </div>
      </div>
      <ul className="space-y-2">
        {maintenance.recent.slice(0, 5).map((t) => (
          <li key={t.id} className="rounded-lg bg-accent/50 px-3 py-2.5">
            <div className="flex justify-between gap-2">
              <p className="text-sm font-medium truncate">{t.title}</p>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{t.workOrderNo}</span>
            </div>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{t.status} · {t.priority}</p>
          </li>
        ))}
        {!maintenance.recent.length && (
          <p className="text-sm text-muted-foreground">No open requests. Tap New to log an issue.</p>
        )}
      </ul>
    </section>
  );
}

export function NotificationsPanel({ notifications }: { notifications: ClientDashboard['notifications'] }) {
  return (
    <section id="notifications" className="panel-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          Notifications
          {notifications.unreadCount > 0 && (
            <span className="text-[10px] bg-solar-500 text-white px-2 py-0.5 rounded-full font-bold">
              {notifications.unreadCount}
            </span>
          )}
        </h2>
        <Link href="/notifications" className="text-xs text-solar-500 hover:underline">
          Inbox
        </Link>
      </div>
      <ul className="space-y-2">
        {notifications.recent.map((n) => (
          <li
            key={n.id}
            className={`rounded-lg px-3 py-2.5 ${
              n.read ? 'bg-accent/30' : 'bg-solar-500/10 border border-solar-500/25'
            }`}
          >
            <p className="text-sm font-medium">{n.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
            {n.createdAt && (
              <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
            )}
          </li>
        ))}
        {!notifications.recent.length && (
          <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
        )}
      </ul>
    </section>
  );
}

export function MobileQuickNav() {
  const links = [
    { href: '#production', label: 'Live', icon: Sun },
    { href: '#battery', label: 'Battery', icon: Battery },
    { href: '#impact', label: 'Savings', icon: DollarSign },
    { href: '#billing', label: 'Bills', icon: CreditCard },
    { href: '#maintenance', label: 'Service', icon: Wrench },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-md safe-area-pb"
      aria-label="Dashboard sections"
    >
      <div className="flex justify-around max-w-3xl mx-auto px-1 py-1">
        {links.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-[56px] text-muted-foreground hover:text-solar-500 transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
