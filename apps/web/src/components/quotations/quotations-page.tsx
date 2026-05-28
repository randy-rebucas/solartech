'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Calculator, FileText, CheckCircle2, Clock } from 'lucide-react';
import { useQuotations } from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { QuotationWizard } from './quotation-wizard';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/layout/page-container';
import { getQuotationStatusConfig } from '@/lib/quotation-status';

export function QuotationsPage() {
  const [showWizard, setShowWizard] = useState(false);
  const { data, isLoading } = useQuotations();

  const quotations = (data as { data: unknown[] } | undefined)?.data ?? [];

  if (showWizard) {
    return <QuotationWizard onClose={() => setShowWizard(false)} />;
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solar Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Sizing, ROI, net metering, equipment BOM, charts & PDF proposals
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: quotations.length, icon: <FileText className="w-4 h-4" /> },
          { label: 'Approved', value: quotations.filter((q: any) => q.status === 'approved').length, icon: <CheckCircle2 className="w-4 h-4 text-solar-500" /> },
          { label: 'Pending',  value: quotations.filter((q: any) => q.status === 'pending').length,  icon: <Clock className="w-4 h-4 text-yellow-500" /> },
          { label: 'Draft',    value: quotations.filter((q: any) => q.status === 'draft').length,    icon: <Calculator className="w-4 h-4" /> },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground">{s.icon}<span className="text-xs">{s.label}</span></div>
            <p className="text-2xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quotation list */}
      <div className="panel-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Quotations</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center">
            <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="font-medium">No quotations yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first AI solar quotation</p>
            <button
              onClick={() => setShowWizard(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(quotations as any[]).map((q) => {
              const cfg = getQuotationStatusConfig(q.status);
              const Icon = cfg.icon;
              return (
                <Link key={q._id} href={`/quotations/${q._id}`} className="block">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 flex items-center gap-4 hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  <div className={cn('p-2.5 rounded-lg', cfg.bg)}>
                    <Icon className={cn('w-4 h-4', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{q.input?.address ?? 'No address'}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.output?.recommendedSystemSizeKw} kW · {q.output?.numberOfPanels} panels · Created {formatDate(q.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm">{q.output?.totalCost ? formatCurrency(q.output.totalCost) : '—'}</p>
                    <span className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</span>
                  </div>
                </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
