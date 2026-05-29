'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Building2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sun,
  TrendingUp,
  Users,
  Eye,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePublicPlatformStats } from '@/hooks/use-api';
import { isNewSiteVisitor, markStatsWidgetSeen } from '@/lib/site-analytics';
import { cn, formatNumber } from '@/lib/utils';

type TrendPoint = {
  date: string;
  label: string;
  visits: number;
  pageViews: number;
  clicks: number;
  users: number;
  organizations: number;
  activeSystems: number;
};

function seriesMax(data: TrendPoint[], key: keyof TrendPoint) {
  return data.reduce((max, row) => {
    const value = row[key];
    return typeof value === 'number' && value > max ? value : max;
  }, 0);
}

function formatTrendTooltipValue(value: number, dataKey: keyof TrendPoint) {
  if (['users', 'organizations', 'activeSystems'].includes(dataKey)) {
    return formatNumber(value);
  }
  return formatNumber(value);
}

function EmptyChart({ message = 'No data yet' }: { message?: string }) {
  return (
    <div className="mt-2 flex h-12 items-center justify-center rounded-md border border-dashed border-border/50 bg-muted/20">
      <p className="text-[10px] text-muted-foreground">{message}</p>
    </div>
  );
}

function MiniSparkline({
  data,
  dataKey,
  color,
  id,
  valueLabel,
}: {
  data: TrendPoint[];
  dataKey: keyof TrendPoint;
  color: string;
  id: string;
  valueLabel: string;
}) {
  const max = seriesMax(data, dataKey);
  if (max === 0) return <EmptyChart />;

  return (
    <div className="h-12 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
            formatter={(value: number) => [formatTrendTooltipValue(value, dataKey), valueLabel]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  data,
  dataKey,
  chartColor,
  chartId,
  valueLabel,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Users;
  iconClass: string;
  data: TrendPoint[];
  dataKey: keyof TrendPoint;
  chartColor: string;
  chartId: string;
  valueLabel: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-tight mt-0.5">{value}</p>
          {sub ? <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p> : null}
        </div>
        <div className={cn('rounded-lg bg-background/60 p-1.5', iconClass)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <MiniSparkline
        data={data}
        dataKey={dataKey}
        color={chartColor}
        id={chartId}
        valueLabel={valueLabel}
      />
    </div>
  );
}

function VisitsSummary({
  totalVisits,
  todayVisits,
  trends,
}: {
  totalVisits: number;
  todayVisits: number;
  trends: TrendPoint[];
}) {
  const hasVisits = seriesMax(trends, 'visits') > 0;

  return (
    <div className="col-span-1 sm:col-span-2 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Site Visits</p>
          <p className="text-2xl font-bold">{formatNumber(totalVisits)}</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">{formatNumber(todayVisits)} today</p>
        </div>
        <div className="rounded-lg bg-background/60 p-2 text-emerald-400">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>
      <div className="h-16 w-full">
        {hasVisits ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="visits-summary-spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                formatter={(value: number) => [formatNumber(value), 'Visits']}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#visits-summary-spark)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Visit data builds as users browse" />
        )}
      </div>
    </div>
  );
}

function LocationsPanel({
  totalLocations,
  locations,
}: {
  totalLocations: number;
  locations: Array<{ label: string; visits: number }>;
}) {
  const chartData = locations.slice(0, 6).map((loc) => ({
    name: loc.label.length > 18 ? `${loc.label.slice(0, 16)}…` : loc.label,
    fullName: loc.label,
    visits: loc.visits,
  }));

  return (
    <div className="col-span-1 sm:col-span-2 rounded-xl border border-border/60 bg-card/80 p-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Visitor Locations</p>
          <p className="text-sm font-semibold">{formatNumber(totalLocations)} regions tracked</p>
        </div>
        <div className="rounded-lg bg-background/60 p-1.5 text-rose-400">
          <MapPin className="w-3.5 h-3.5" />
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No location data yet</p>
      ) : (
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={72}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={(value: number) => [formatNumber(value), 'Visits']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
              />
              <Bar dataKey="visits" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {locations.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-border/40 pt-2">
          {locations.slice(0, 4).map((loc) => (
            <li key={loc.label} className="flex items-center justify-between text-[11px]">
              <span className="truncate text-muted-foreground">{loc.label}</span>
              <span className="font-medium tabular-nums">{formatNumber(loc.visits)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FloatingStatsWidget() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = usePublicPlatformStats(open);

  useEffect(() => {
    if (!isNewSiteVisitor()) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      markStatsWidgetSeen();
    }, 600);

    return () => window.clearTimeout(timer);
  }, []);

  const trends = useMemo(() => data?.trends ?? [], [data?.trends]);

  const stats = useMemo(
    () => [
      {
        label: 'Total Users',
        value: data?.totalUsers != null ? formatNumber(data.totalUsers) : '—',
        sub: 'Registered accounts · 7-day total',
        icon: Users,
        iconClass: 'text-blue-400',
        dataKey: 'users' as const,
        chartColor: '#60a5fa',
        chartId: 'users-spark',
        valueLabel: 'Total users',
      },
      {
        label: 'Visits',
        value: data?.totalVisits != null ? formatNumber(data.totalVisits) : '—',
        sub: data?.today ? `${formatNumber(data.today.visits)} today` : undefined,
        icon: TrendingUp,
        iconClass: 'text-emerald-400',
        dataKey: 'visits' as const,
        chartColor: '#34d399',
        chartId: 'visits-spark',
        valueLabel: 'Visits',
        hide: true,
      },
      {
        label: 'Page Views',
        value: data?.totalPageViews != null ? formatNumber(data.totalPageViews) : '—',
        sub: data?.today ? `${formatNumber(data.today.pageViews)} today · daily trend` : 'Daily trend',
        icon: Eye,
        iconClass: 'text-cyan-400',
        dataKey: 'pageViews' as const,
        chartColor: '#22d3ee',
        chartId: 'pageviews-spark',
        valueLabel: 'Page views',
      },
      {
        label: 'Organizations',
        value: data?.totalOrganizations != null ? formatNumber(data.totalOrganizations) : '—',
        sub: 'On platform · 7-day total',
        icon: Building2,
        iconClass: 'text-purple-400',
        dataKey: 'organizations' as const,
        chartColor: '#a78bfa',
        chartId: 'orgs-spark',
        valueLabel: 'Organizations',
      },
      {
        label: 'Active Systems',
        value: data?.activeSystems != null ? formatNumber(data.activeSystems) : '—',
        sub: 'Operational solar · 7-day total',
        icon: Sun,
        iconClass: 'text-solar-400',
        dataKey: 'activeSystems' as const,
        chartColor: '#f59e0b',
        chartId: 'systems-spark',
        valueLabel: 'Active systems',
      },
    ],
    [data],
  );

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto w-[min(100vw-3rem,24rem)] rounded-2xl border border-border/70 bg-background/95 shadow-2xl backdrop-blur-xl overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 bg-gradient-to-r from-solar-500/10 to-emerald-500/10">
              <div>
                <p className="text-sm font-semibold">Platform Live Stats</p>
                <p className="text-[11px] text-muted-foreground">
                  {isError
                    ? 'Unable to load stats — is the API running?'
                    : 'Real-time data · last 7 days'}
                  {isFetching && !isLoading ? ' · updating…' : ''}
                </p>
              </div>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </div>

            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[min(75vh,32rem)] overflow-y-auto">
              {isError ? (
                <div className="col-span-1 sm:col-span-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                  <p className="text-sm text-destructive">Could not reach the analytics API.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start the API with <code className="text-foreground">npm run dev</code> from the repo root.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-3 text-xs font-medium text-solar-500 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-xl border border-border/40 bg-muted/30 animate-pulse',
                      i === 0 || i === 6 ? 'col-span-1 sm:col-span-2 h-32' : 'h-28',
                    )}
                  />
                ))
              ) : (
                <>
                  <VisitsSummary
                    totalVisits={data?.totalVisits ?? 0}
                    todayVisits={data?.today?.visits ?? 0}
                    trends={trends}
                  />
                  {stats
                    .filter((stat) => !('hide' in stat && stat.hide))
                    .map((stat) => (
                      <StatTile
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        sub={stat.sub}
                        icon={stat.icon}
                        iconClass={stat.iconClass}
                        data={trends}
                        dataKey={stat.dataKey}
                        chartColor={stat.chartColor}
                        chartId={stat.chartId}
                        valueLabel={stat.valueLabel}
                      />
                    ))}
                  <LocationsPanel
                    totalLocations={data?.totalLocations ?? 0}
                    locations={data?.topLocations ?? []}
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-xl transition-colors hover:bg-accent"
        aria-expanded={open}
        aria-label={open ? 'Hide platform stats' : 'Show platform stats'}
      >
        <Activity className="w-4 h-4 text-solar-500" />
        <span>Live Stats</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
    </div>
  );
}
