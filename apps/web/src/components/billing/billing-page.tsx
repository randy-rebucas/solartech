'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useGet,
  usePatch,
  usePost,
  useInvoices,
  useSubscriptions,
  useFinancingApplications,
  useFinancialReport,
} from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import {
  DollarSign,
  FileText,
  TrendingUp,
  Download,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  BellRing,
  WalletCards,
  Landmark,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const statusIcon: Record<string, any> = {
  paid: CheckCircle,
  sent: Clock,
  pending: Clock,
  draft: Clock,
  overdue: AlertCircle,
  cancelled: XCircle,
};
const statusColor: Record<string, string> = {
  paid: 'text-emerald-400',
  sent: 'text-amber-400',
  pending: 'text-amber-400',
  draft: 'text-muted-foreground',
  overdue: 'text-red-400',
  cancelled: 'text-muted-foreground',
};

function invoiceClientName(inv: { clientId?: { firstName?: string; lastName?: string; email?: string }; clientName?: string }) {
  const c = inv.clientId;
  if (c && typeof c === 'object') {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ');
    return name || c.email || 'Client';
  }
  return inv.clientName ?? 'Client';
}

export function BillingPage() {
  const [tab, setTab] = useState<'invoices' | 'revenue' | 'financing'>('invoices');
  const { data: invoicePage, isError: invoicesError } = useInvoices();
  const { data: stats, isError: statsError } = useGet<RevenueStats>(
    ['billing', 'revenue-stats'],
    '/api/v1/billing/revenue-stats',
  );
  const { data: subscriptions } = useSubscriptions();
  const { data: financingApps } = useFinancingApplications();
  const { data: report } = useFinancialReport();
  const payMutation = usePatch<Record<string, never>, unknown>([['invoices'], ['billing', 'revenue-stats']]);
  const reminderMutation = usePost<Record<string, never>, { remindersSent: number }>(
    '/api/v1/billing/reminders/run',
    [['invoices'], ['billing', 'revenue-stats'], ['billing', 'financial-report']],
  );
  const approveMutation = usePatch<{ approved: boolean; notes?: string }, unknown>([['billing', 'financing']]);

  const invoiceList: InvoiceRow[] = Array.isArray((invoicePage as PaginatedInvoices | undefined)?.data)
    ? (invoicePage as PaginatedInvoices).data
    : [];

  const kpis = [
    { label: 'Total Revenue', value: stats?.thisYear?.total ? `₱${(stats.thisYear.total / 1000).toFixed(1)}k` : '—', icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Outstanding', value: stats?.outstanding?.total ? `₱${(stats.outstanding.total / 1000).toFixed(1)}k` : '—', icon: Clock, color: 'text-amber-400' },
    { label: 'This Month', value: stats?.thisMonth?.total ? `₱${(stats.thisMonth.total / 1000).toFixed(1)}k` : '—', icon: TrendingUp, color: 'text-solar-400' },
    { label: 'Invoices', value: stats?.thisYear?.count ?? '—', icon: FileText, color: 'text-blue-400' },
    { label: 'Due Reminders', value: stats?.remindersDue ?? 0, icon: BellRing, color: 'text-orange-400' },
  ];

  const revenueChart = (stats?.monthlyTrend ?? []).map((row: { _id: string; revenue: number }) => {
    const [, month] = row._id.split('-');
    const monthLabel = new Date(2000, Number(month) - 1, 1).toLocaleString('en-US', { month: 'short' });
    return { month: monthLabel, revenue: row.revenue, expenses: 0 };
  });

  return (
    <PageContainer>
      {(invoicesError || statsError) && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          Could not load billing data. Ensure the API is running at{' '}
          {process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000'} and you are signed in.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing & Revenue</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage invoices, payments and financing</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => reminderMutation.mutate({})}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            <BellRing className="w-4 h-4" /> Auto reminders
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className={`w-4 h-4 ${k.color}`} />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
          </motion.div>
        ))}
      </div>

      {(subscriptions?.length ?? 0) > 0 && (
        <div className="panel-card p-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <WalletCards className="w-4 h-4 text-cyan-400" /> Subscription billing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {subscriptions?.slice(0, 3).map((s) => (
              <div key={s._id} className="rounded-lg bg-accent/50 p-3">
                <p className="text-sm font-medium">{s.subscription?.planName ?? 'Subscription'}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {s.subscription?.interval ?? 'monthly'} · {s.status}
                </p>
                <p className="text-sm font-semibold mt-1">₱{Math.round(s.total).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(['invoices', 'revenue', 'financing'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-solar-500 text-white' : 'bg-accent hover:bg-accent/80'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'invoices' && (
        <div className="panel-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Invoices</h3>
          </div>
          <div className="divide-y divide-border">
            {invoiceList.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No invoices yet.</p>
            ) : invoiceList.map((inv) => {
              const Icon = statusIcon[inv.status] ?? Clock;
              return (
                <div key={inv._id ?? inv.id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inv.invoiceNumber ?? inv.id}</p>
                      <p className="text-xs text-muted-foreground">{invoiceClientName(inv)} · {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">₱{(inv.total ?? inv.amount ?? 0).toLocaleString()}</p>
                      <div className={`flex items-center gap-1 text-xs ${statusColor[inv.status] ?? 'text-muted-foreground'}`}>
                        <Icon className="w-3 h-3" />
                        <span className="capitalize">{inv.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(inv.status === 'sent' || inv.status === 'pending' || inv.status === 'overdue') && (
                        <button
                          type="button"
                          disabled={payMutation.isPending}
                          onClick={() =>
                            payMutation.mutateAsync({
                              url: `/api/v1/billing/invoices/${inv._id ?? inv.id}/pay`,
                              data: {},
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-solar-500 text-white text-xs hover:opacity-90 disabled:opacity-50"
                        >
                          {payMutation.isPending ? '…' : 'Mark paid'}
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-accent">
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {revenueChart.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">No revenue history yet. Paid invoices will appear here.</p>
          )}
          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4">Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v: any) => [`₱${v.toLocaleString()}`, '']} />
                <Bar dataKey="revenue" fill="url(#solarGrad)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="rgba(239,68,68,0.4)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4">Monthly Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v: any) => [`₱${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {report && (
            <div className="panel-card p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4">Financial reports & integrations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-lg bg-accent/40 p-3">
                  <p className="text-xs text-muted-foreground">Installment plans</p>
                  <p className="text-xl font-bold mt-1">{report.installmentPlans}</p>
                </div>
                <div className="rounded-lg bg-accent/40 p-3">
                  <p className="text-xs text-muted-foreground">Financing applications</p>
                  <p className="text-xl font-bold mt-1">{report.financingApplications}</p>
                </div>
                <div className="rounded-lg bg-accent/40 p-3">
                  <p className="text-xs text-muted-foreground">Active subscriptions</p>
                  <p className="text-xl font-bold mt-1">{report.subscriptions}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium mb-2">Due date tracking buckets</p>
                  <div className="space-y-1.5 text-xs">
                    {report.dueDateTracking.map((b) => (
                      <div key={b._id} className="flex items-center justify-between">
                        <span>{b._id}</span>
                        <span>₱{Math.round(b.total).toLocaleString()} ({b.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium mb-2">Payment & financing integrations</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[...(report.integrations.stripe ? ['Stripe'] : []), 'PayPal', ...report.integrations.localPH, ...report.integrations.bankFinancing].map((i) => (
                      <span key={i} className="px-2 py-1 rounded-full bg-accent text-muted-foreground">{i}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'financing' && (
        <div className="panel-card p-6">
          <h3 className="font-semibold mb-4">Financing Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {financingPlans.map((plan) => (
              <div key={plan.name} className={`rounded-xl border p-5 ${plan.featured ? 'border-solar-500/50 bg-solar-500/5' : 'border-border bg-accent/30'}`}>
                {plan.featured && <span className="text-xs font-medium text-solar-400 bg-solar-500/10 px-2 py-0.5 rounded-full mb-3 inline-block">Popular</span>}
                <h4 className="font-bold text-lg">{plan.name}</h4>
                <p className="text-3xl font-bold mt-2">{plan.rate}%<span className="text-sm font-normal text-muted-foreground"> /yr</span></p>
                <p className="text-sm text-muted-foreground mt-1">{plan.term} months · {plan.downPayment}% down</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full mt-5 py-2 rounded-lg text-sm font-medium transition-opacity ${plan.featured ? 'bg-gradient-solar text-white hover:opacity-90' : 'border border-border hover:bg-accent'}`}>
                  Apply Now
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-400" /> Financing approvals
            </h4>
            <div className="space-y-2">
              {financingApps?.slice(0, 6).map((app) => (
                <div key={app._id} className="rounded-lg bg-accent/40 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{app.referenceNo}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.provider} · {app.termMonths} months · {app.annualRate}% APR
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">₱{Math.round(app.amount).toLocaleString()}</p>
                    {app.status === 'submitted' || app.status === 'under_review' ? (
                      <button
                        type="button"
                        onClick={() => approveMutation.mutateAsync({
                          url: `/api/v1/billing/financing/${app._id}/approve`,
                          data: { approved: true, notes: 'Approved from billing dashboard' },
                        })}
                        className="px-2 py-1 text-xs rounded bg-solar-500 text-white"
                      >
                        Approve
                      </button>
                    ) : (
                      <span className="text-xs capitalize text-muted-foreground">{app.status}</span>
                    )}
                  </div>
                </div>
              ))}
              {!financingApps?.length && (
                <p className="text-sm text-muted-foreground">No financing applications yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

type PaginatedInvoices = { data: InvoiceRow[] };
type InvoiceRow = {
  _id?: string;
  id?: string;
  invoiceNumber?: string;
  clientName?: string;
  clientId?: { firstName?: string; lastName?: string; email?: string };
  total?: number;
  amount?: number;
  status: string;
  dueDate: string;
};
type RevenueStats = {
  thisMonth?: { total: number; count: number };
  thisYear?: { total: number; count: number };
  outstanding?: { total: number; count: number };
  monthlyTrend?: Array<{ _id: string; revenue: number }>;
  remindersDue?: number;
  commissionSummary?: Array<{ _id: string; total: number; count: number }>;
};

const financingPlans = [
  { name: 'Basic', rate: 8.5, term: 24, downPayment: 20, featured: false, features: ['Fixed interest rate', 'No prepayment penalty', 'Online management'] },
  { name: 'Standard', rate: 6.9, term: 60, downPayment: 10, featured: true, features: ['Lower monthly payments', 'Tax incentive eligible', 'Priority support', 'Insurance included'] },
  { name: 'Premium', rate: 5.5, term: 120, downPayment: 5, featured: false, features: ['10-year term', 'Lowest down payment', 'Dedicated account manager', 'Annual performance review'] },
];
