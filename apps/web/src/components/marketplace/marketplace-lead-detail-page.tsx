'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Gavel, MessageSquare, Shield, Loader2 } from 'lucide-react';
import {
  useMarketplaceLead, useLeadBids, useLeadMessages, useMarketplaceBookings,
} from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const ESCROW_STEPS = [
  'pending_deposit',
  'escrow_funded',
  'in_progress',
  'milestone_complete',
  'released',
] as const;

export function MarketplaceLeadDetailPage({ leadId }: { leadId: string }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { data: lead, isLoading } = useMarketplaceLead(leadId);
  const { data: bids } = useLeadBids(leadId);
  const { data: messages } = useLeadMessages(leadId);
  const { data: bookingsData } = useMarketplaceBookings();

  const [chatText, setChatText] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidText, setBidText] = useState('');

  const leadRow = lead as {
    _id: string;
    title: string;
    description?: string;
    status: string;
    city: string;
    clientId?: { _id?: string; firstName?: string; lastName?: string };
    installerId?: { _id?: string; businessName?: string };
  } | undefined;

  const bidList = (bids as Array<{
    _id: string;
    amount: number;
    status: string;
    proposalText?: string;
    installerId?: { businessName?: string; isVerified?: boolean };
  }>) ?? [];

  const msgList = (messages as Array<{
    _id: string;
    body: string;
    senderId?: { firstName?: string; lastName?: string; _id?: string };
    createdAt?: string;
  }>) ?? [];

  const bookings = (bookingsData as Array<{
    _id: string;
    leadId?: string | { _id?: string };
    escrowStatus: string;
    totalAmount: number;
    scheduledDate: string;
    escrowHeldAmount?: number;
  }>) ?? [];
  const booking = bookings.find((b) => {
    const lid = typeof b.leadId === 'object' ? b.leadId?._id : b.leadId;
    return String(lid) === leadId;
  });

  const isClient = user?.role === 'client';
  const isInstaller = user?.role === 'installer' || user?.role === 'solar_company';

  const sendMsg = useMutation({
    mutationFn: (body: string) => api.post(`/api/v1/marketplace/leads/${leadId}/messages`, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace', 'leads', leadId, 'messages'] });
      setChatText('');
    },
  });

  const placeBid = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/marketplace/leads/${leadId}/bids`, {
        amount: Number(bidAmount),
        proposalText: bidText,
        estimatedDurationDays: 14,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace', 'leads', leadId, 'bids'] });
      qc.invalidateQueries({ queryKey: ['marketplace', 'leads', leadId] });
      setBidAmount('');
      setBidText('');
    },
  });

  const acceptBid = useMutation({
    mutationFn: (bidId: string) => api.patch(`/api/v1/marketplace/bids/${bidId}/accept`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace', 'leads'] });
      qc.invalidateQueries({ queryKey: ['marketplace', 'leads', leadId] });
    },
  });

  const advanceEscrow = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: string }) =>
      api.patch(`/api/v1/marketplace/bookings/${bookingId}/escrow`, {
        escrowStatus: status,
        escrowHeldAmount: status === 'escrow_funded' ? booking?.totalAmount : undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace', 'bookings'] }),
  });

  const createBooking = useMutation({
    mutationFn: (bidId: string) => {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return api.post('/api/v1/marketplace/bookings', {
        leadId,
        bidId,
        scheduledDate: d.toISOString(),
        totalAmount: bidList.find((b) => b._id === bidId)?.amount ?? 0,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace', 'bookings'] });
      qc.invalidateQueries({ queryKey: ['marketplace', 'leads', leadId] });
    },
  });

  if (isLoading || !leadRow) {
    return (
      <PageContainer>
        <Loader2 className="w-8 h-8 animate-spin mx-auto mt-20 text-muted-foreground" />
      </PageContainer>
    );
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40';

  return (
    <PageContainer>
      <Link href="/marketplace/leads" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Leads
      </Link>

      <div className="panel-card p-5 mb-4">
        <h1 className="text-xl font-bold">{leadRow.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {leadRow.city} · <span className="capitalize">{leadRow.status}</span>
        </p>
        {leadRow.description && <p className="text-sm mt-3">{leadRow.description}</p>}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="panel-card p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Gavel className="w-4 h-4" /> Project bidding ({bidList.length})
            </h2>
            <div className="space-y-2">
              {bidList.map((b) => (
                <div key={b._id} className="p-3 rounded-lg bg-accent/50 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {b.installerId?.businessName}
                      {b.installerId?.isVerified && ' ✓'}
                    </p>
                    <p className="text-lg font-bold text-solar-500">{formatCurrency(b.amount)}</p>
                    {b.proposalText && <p className="text-xs text-muted-foreground mt-1">{b.proposalText}</p>}
                  </div>
                  {isClient && b.status === 'submitted' && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => acceptBid.mutate(b._id)}
                        className="text-xs px-2 py-1 rounded bg-solar-500/15 text-solar-500"
                      >
                        Accept bid
                      </button>
                      <button
                        type="button"
                        onClick={() => createBooking.mutate(b._id)}
                        className="text-xs px-2 py-1 rounded border border-border"
                      >
                        Book + escrow
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {isInstaller && ['open', 'bidding'].includes(leadRow.status) && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Submit your bid</p>
                <input type="number" placeholder="Amount (₱)" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className={inputCls} />
                <textarea placeholder="Proposal" value={bidText} onChange={(e) => setBidText(e.target.value)} rows={2} className={inputCls} />
                <button
                  type="button"
                  disabled={!bidAmount || placeBid.isPending}
                  onClick={() => placeBid.mutate()}
                  className="w-full py-2 rounded-lg bg-gradient-solar text-white text-sm"
                >
                  Place bid
                </button>
              </div>
            )}
          </div>

          {booking && (
            <div className="panel-card p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-solar-500" /> Escrow workflow
              </h2>
              <p className="text-sm mb-2">
                {formatCurrency(booking.totalAmount)} ·{' '}
                <span className="capitalize">{booking.escrowStatus.replace(/_/g, ' ')}</span>
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {ESCROW_STEPS.map((s) => (
                  <span
                    key={s}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      booking.escrowStatus === s ? 'bg-solar-500/20 text-solar-500' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              {(isClient || isInstaller) && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = ESCROW_STEPS.indexOf(booking.escrowStatus as typeof ESCROW_STEPS[number]);
                    const next = ESCROW_STEPS[Math.min(idx + 1, ESCROW_STEPS.length - 1)];
                    advanceEscrow.mutate({ bookingId: booking._id, status: next });
                  }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-solar-500/40 text-solar-500"
                >
                  Advance escrow step
                </button>
              )}
            </div>
          )}
        </div>

        <div className="panel-card p-5 flex flex-col h-[420px]">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4" /> Chat
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {msgList.map((m) => (
              <div key={m._id} className="text-sm p-2 rounded-lg bg-accent/50">
                <span className="text-xs font-medium text-solar-500">
                  {m.senderId?.firstName} {m.senderId?.lastName}
                </span>
                <p className="mt-0.5">{m.body}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Type a message…"
              className={inputCls}
              onKeyDown={(e) => e.key === 'Enter' && chatText && sendMsg.mutate(chatText)}
            />
            <button
              type="button"
              disabled={!chatText || sendMsg.isPending}
              onClick={() => sendMsg.mutate(chatText)}
              className="px-3 py-2 rounded-lg bg-solar-500 text-white text-sm shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
