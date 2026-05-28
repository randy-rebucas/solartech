'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Sun, Leaf, CreditCard, ArrowRight } from 'lucide-react';
import { useGet, useRevenueStats } from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { formatCurrency, formatNumber } from '@/lib/utils';

type AnalyticsDashboard = {
  systems?: { total: number; active: number; totalKw: number };
  revenue?: Array<{ _id: string; revenue: number }>;
};

export function InvestorDashboard() {
  const { data: stats } = useRevenueStats();
  const { data: dashboard } = useGet<AnalyticsDashboard>(
    ['analytics', 'dashboard'],
    '/api/v1/analytics/dashboard',
  );

  const systems = dashboard?.systems;
  const yearRevenue = stats?.thisYear?.total ?? 0;
  const outstanding = stats?.outstanding?.total ?? 0;

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-bold">Investment Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Portfolio performance for your linked solar organization
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Fleet capacity', value: `${((systems?.totalKw ?? 0) / 1000).toFixed(1)} MW`, icon: Sun, color: 'text-solar-500' },
          { label: 'Active systems', value: formatNumber(systems?.active ?? 0), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Revenue (YTD)', value: formatCurrency(yearRevenue), icon: DollarSign, color: 'text-yellow-400' },
          { label: 'Outstanding', value: formatCurrency(outstanding), icon: CreditCard, color: 'text-amber-400' },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card"
          >
            <k.icon className={`w-5 h-5 ${k.color} mb-2`} />
            <p className="text-xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/billing" className="panel-card p-5 hover:border-solar-500/30 transition-colors group">
          <h2 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-solar-500" />
            Billing & financing
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Invoices, revenue trends, and financing options
          </p>
          <span className="inline-flex items-center gap-1 text-sm text-solar-500 mt-3 group-hover:underline">
            Open billing <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
        <Link href="/analytics" className="panel-card p-5 hover:border-solar-500/30 transition-colors group">
          <h2 className="font-semibold flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-500" />
            Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Production, carbon impact, and energy reports
          </p>
          <span className="inline-flex items-center gap-1 text-sm text-solar-500 mt-3 group-hover:underline">
            View analytics <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </PageContainer>
  );
}
