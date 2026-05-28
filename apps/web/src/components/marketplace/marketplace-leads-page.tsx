'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Gavel, MessageSquare, Loader2 } from 'lucide-react';
import { useMarketplaceLeads } from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { cn, formatCurrency } from '@/lib/utils';
import { RequestLeadModal } from './request-lead-modal';

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-500/15 text-blue-400',
  bidding: 'bg-yellow-500/15 text-yellow-500',
  awarded: 'bg-solar-500/15 text-solar-500',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

export function MarketplaceLeadsPage() {
  const [showNew, setShowNew] = useState(false);
  const { data, isLoading } = useMarketplaceLeads();
  const leads = (data as { data?: Array<{
    _id: string;
    title: string;
    city: string;
    status: string;
    bidCount?: number;
    requestType?: string;
    budgetMin?: number;
    budgetMax?: number;
    installerId?: { businessName?: string };
  }> })?.data ?? [];

  return (
    <PageContainer>
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Marketplace
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead management</h1>
          <p className="text-sm text-muted-foreground">Quotation requests, bidding & escrow bookings</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New request
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <div className="panel-card p-12 text-center text-muted-foreground text-sm">
          No leads yet. Post an open RFQ or request a quote from an installer profile.
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Link
              key={lead._id}
              href={`/marketplace/leads/${lead._id}`}
              className="panel-card p-4 block hover:border-solar-500/30 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{lead.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lead.city} · {lead.requestType}
                    {lead.installerId?.businessName && ` · ${lead.installerId.businessName}`}
                  </p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', STATUS_STYLE[lead.status] ?? STATUS_STYLE.open)}>
                  {lead.status}
                </span>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gavel className="w-3.5 h-3.5" /> {lead.bidCount ?? 0} bids
                </span>
                {(lead.budgetMin || lead.budgetMax) && (
                  <span>
                    Budget {lead.budgetMin ? formatCurrency(lead.budgetMin) : '—'}
                    {lead.budgetMax ? ` – ${formatCurrency(lead.budgetMax)}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNew && <RequestLeadModal onClose={() => setShowNew(false)} />}
    </PageContainer>
  );
}
