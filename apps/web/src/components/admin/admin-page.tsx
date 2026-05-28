'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminAnalytics, useGet, usePatch } from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { formatRelativeTime } from '@/lib/analytics-range';
import { formatNumber } from '@/lib/utils';
import {
  Users,
  Building2,
  DollarSign,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Store,
  Cpu,
  Activity,
  ScrollText,
  Settings2,
  BrainCircuit,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const tabs = ['overview', 'users', 'marketplace', 'devices', 'ai', 'audit', 'settings'] as const;
type Tab = typeof tabs[number];

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const { data: stats } = useAdminAnalytics();
  const { data: usersPage, refetch: refetchUsers } = useGet<{ items: any[] }>(['users'], '/api/v1/users');
  const { data: orgsPage } = useGet<{ items: any[] }>(['organizations'], '/api/v1/organizations');
  const patchUser = usePatch<any, any>([['users']]);

  const users = usersPage?.items ?? [];
  const orgs = orgsPage?.items ?? [];

  const deviceStatusData = useMemo(() => {
    const dm = stats?.deviceMonitoring;
    if (!dm) return [];
    return [
      { name: 'Online', value: dm.online, color: '#22c55e' },
      { name: 'Warning', value: dm.warning, color: '#f59e0b' },
      { name: 'Offline', value: dm.offline, color: '#ef4444' },
      { name: 'Maintenance', value: dm.maintenance, color: '#3b82f6' },
    ];
  }, [stats?.deviceMonitoring]);

  const marketplaceData = useMemo(() => {
    const m = stats?.marketplaceManagement;
    if (!m) return [];
    return [
      { stage: 'Open', count: m.openLeads },
      { stage: 'Bidding', count: m.biddingLeads },
      { stage: 'Awarded', count: m.awardedLeads },
      { stage: 'Bookings', count: m.bookings },
    ];
  }, [stats?.marketplaceManagement]);

  const aiSignalData = stats?.aiInsights?.signalCounts ?? [];

  const kpis = [
    { label: 'Total Users', value: stats?.totalUsers != null ? formatNumber(stats.totalUsers) : '—', icon: Users, color: 'text-blue-400', delta: 'Registered accounts' },
    { label: 'Organizations', value: stats?.totalOrgs != null ? formatNumber(stats.totalOrgs) : '—', icon: Building2, color: 'text-purple-400', delta: 'On platform' },
    { label: 'Platform Revenue', value: stats?.revenue != null ? `₱${(stats.revenue / 1_000_000).toFixed(2)}M` : '—', icon: DollarSign, color: 'text-emerald-400', delta: 'Paid invoices' },
    { label: 'Active Systems', value: stats?.activeSystems != null ? formatNumber(stats.activeSystems) : '—', icon: Zap, color: 'text-solar-400', delta: 'Operational' },
    { label: 'Pending Verifications', value: stats?.pendingVerifications != null ? String(stats.pendingVerifications) : '—', icon: ShieldCheck, color: 'text-amber-400', delta: 'Inactive users' },
    { label: 'Open Alerts', value: stats?.openAlerts != null ? String(stats.openAlerts) : '—', icon: AlertTriangle, color: 'text-red-400', delta: 'Maintenance tickets' },
    { label: 'Realtime Telemetry', value: stats?.realtimeMetrics?.telemetryPointsLastHour != null ? formatNumber(stats.realtimeMetrics.telemetryPointsLastHour) : '—', icon: Activity, color: 'text-cyan-400', delta: 'Points in last hour' },
    { label: 'Marketplace Leads', value: stats?.marketplaceManagement ? formatNumber((stats.marketplaceManagement.openLeads ?? 0) + (stats.marketplaceManagement.biddingLeads ?? 0)) : '—', icon: Store, color: 'text-pink-400', delta: 'Open + bidding' },
  ];

  const userGrowth = stats?.userGrowth ?? [];
  const revenueByPlan = stats?.revenueByPlan ?? [];
  const recentActivity = useMemo(
    () => (stats?.recentActivity ?? []).map((a: { type: string; message: string; time: string }) => ({
      ...a,
      time: formatRelativeTime(a.time),
    })),
    [stats],
  );

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide oversight and management</p>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-solar-500 text-white' : 'bg-accent hover:bg-accent/80'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="stat-card">
                <div className="flex items-center gap-2 mb-3">
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                </div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.delta}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4">New User Registrations</h3>
              {userGrowth.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">No registration data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={userGrowth}>
                    <defs>
                      <linearGradient id="usrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="url(#usrGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4">Revenue by Plan</h3>
              {revenueByPlan.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">No paid invoices by plan yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueByPlan}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="plan" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Revenue']} />
                    <defs>
                      <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="revenue" fill="url(#planGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> Device Monitoring
              </h3>
              {deviceStatusData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No device metrics yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={deviceStatusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72}>
                      {deviceStatusData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="panel-card p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Store className="w-4 h-4 text-purple-400" /> Marketplace Funnel
              </h3>
              {marketplaceData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No marketplace data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={marketplaceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="panel-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Realtime Platform Metrics
              </h3>
              <span className="text-xs text-muted-foreground">Auto-refresh every 10s</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">API status</p>
                <p className="text-lg font-bold capitalize">{stats?.realtimeMetrics?.apiStatus ?? 'unknown'}</p>
              </div>
              <div className="rounded-lg bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">Active orgs (24h)</p>
                <p className="text-lg font-bold">{stats?.realtimeMetrics?.organizationsActiveLast24h ?? 0}</p>
              </div>
              <div className="rounded-lg bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">Telemetry points (1h)</p>
                <p className="text-lg font-bold">{stats?.realtimeMetrics?.telemetryPointsLastHour ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No platform notifications yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a: { type: string; message: string; time: string }, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.type === 'error' ? 'bg-red-400' : a.type === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="panel-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">All Users ({users.length})</h3>
            <input placeholder="Search users…" className="px-3 py-1.5 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40 w-48" />
          </div>
          <div className="divide-y divide-border">
            {users.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No users found.</p>
            ) : users.map((u: any) => (
              <div key={u._id ?? u.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-solar flex items-center justify-center text-white text-sm font-bold">
                    {(u.firstName ?? u.name ?? 'U')[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.firstName ?? ''} {u.lastName ?? u.name ?? ''}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-accent px-2 py-0.5 rounded-full capitalize">{u.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => {
                      const id = u._id ?? u.id;
                      const url = u.isActive ? `/api/v1/users/${id}/deactivate` : `/api/v1/users/${id}/activate`;
                      patchUser.mutateAsync({ url, data: {} }).then(() => refetchUsers());
                    }}
                    className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-accent">
                    Toggle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'marketplace' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4">Marketplace KPIs</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-accent/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Open leads</p>
                <p className="text-2xl font-bold">{stats?.marketplaceManagement?.openLeads ?? 0}</p>
              </div>
              <div className="bg-accent/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Bidding leads</p>
                <p className="text-2xl font-bold">{stats?.marketplaceManagement?.biddingLeads ?? 0}</p>
              </div>
              <div className="bg-accent/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Awarded leads</p>
                <p className="text-2xl font-bold">{stats?.marketplaceManagement?.awardedLeads ?? 0}</p>
              </div>
              <div className="bg-accent/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Escrow value</p>
                <p className="text-2xl font-bold">₱{Math.round(stats?.marketplaceManagement?.escrowValue ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4">Organizations (Marketplace operators)</h3>
            <div className="max-h-[320px] overflow-y-auto space-y-2">
              {orgs.map((org: any) => (
                <div key={org._id ?? org.id} className="rounded-lg bg-accent/40 px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">Plan: {org.plan ?? 'starter'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${org.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {org.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'devices' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4">Device Fleet Status</h3>
            {deviceStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No device data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deviceStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {deviceStatusData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4">Organization Portfolio</h3>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {orgs.map((org: any) => (
                <div key={org._id ?? org.id} className="rounded-lg bg-accent/40 p-3">
                  <p className="text-sm font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Users: {org.userCount ?? 0} · Systems: {org.systemCount ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-solar-500" /> AI Insights
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Top signal: <span className="text-foreground">{stats?.aiInsights?.topSignal ?? '—'}</span>
              </p>
              {aiSignalData.map((sig) => (
                <div key={sig.event} className="rounded-lg bg-accent/40 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-sm">{sig.event}</span>
                  <span className="text-sm font-semibold">{sig.count}</span>
                </div>
              ))}
              {!aiSignalData.length && <p className="text-sm text-muted-foreground">No AI signals yet.</p>}
            </div>
          </div>
          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4">AI Signal Trend</h3>
            {!aiSignalData.length ? (
              <p className="text-sm text-muted-foreground">No trend data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={aiSignalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="event" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="panel-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-cyan-400" /> Audit Logs
          </h3>
          <div className="space-y-2">
            {(stats?.auditLogs ?? []).map((log, i) => (
              <div key={`${log.category}-${i}`} className="rounded-lg bg-accent/40 p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.category}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    log.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                    log.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {log.severity}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(log.time)}</p>
                </div>
              </div>
            ))}
            {!stats?.auditLogs?.length && (
              <p className="text-sm text-muted-foreground">No audit logs yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="panel-card p-5 md:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-purple-400" /> Platform Settings
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">Maintenance mode</p>
                <p className="font-medium mt-1">{stats?.platformSettings?.maintenanceMode ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div className="rounded-lg bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">AI assistant</p>
                <p className="font-medium mt-1">{stats?.platformSettings?.aiAssistantEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div className="rounded-lg bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">MQTT</p>
                <p className="font-medium mt-1">{stats?.platformSettings?.mqttEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div className="rounded-lg bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">Locale</p>
                <p className="font-medium mt-1">{stats?.platformSettings?.locale ?? 'en-PH'}</p>
              </div>
            </div>
          </div>
          <div className="panel-card p-5">
            <h3 className="font-semibold mb-4">Payment Gateways</h3>
            <div className="space-y-2">
              {(stats?.platformSettings?.paymentGateways ?? []).map((g) => (
                <div key={g} className="rounded-lg bg-accent/40 px-3 py-2 text-sm capitalize">{g.replace(/_/g, ' ')}</div>
              ))}
              {!stats?.platformSettings?.paymentGateways?.length && (
                <p className="text-sm text-muted-foreground">No gateway settings found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
