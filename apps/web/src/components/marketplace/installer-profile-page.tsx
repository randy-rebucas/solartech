'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BadgeCheck, Star, MapPin, Shield, Award, Briefcase,
  Calendar, Loader2,
} from 'lucide-react';
import {
  useInstaller, useInstallerAnalytics, useInstallerAvailability,
} from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { RequestLeadModal } from './request-lead-modal';

type InstallerDetail = {
  _id: string;
  businessName: string;
  description?: string;
  serviceAreas?: string[];
  certifications?: Array<{ name: string; issuedBy: string; issuedAt?: string }>;
  portfolio?: Array<{
    title: string;
    systemSizeKw: number;
    completedAt?: string;
    clientTestimonial?: string;
  }>;
  avgRating?: number;
  totalReviews?: number;
  totalProjects?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  specializations?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  reviews?: Array<{
    rating: number;
    comment: string;
    reviewerId?: { firstName?: string; lastName?: string };
    createdAt?: string;
  }>;
};

const TABS = ['Overview', 'Portfolio', 'Reviews', 'Certifications', 'Availability'] as const;

export function InstallerProfilePage({ installerId }: { installerId: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const [showRequest, setShowRequest] = useState(false);
  const { data, isLoading } = useInstaller(installerId);
  const { data: analytics } = useInstallerAnalytics(installerId);
  const { data: availability } = useInstallerAvailability(installerId);

  const installer = data as InstallerDetail | undefined;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!installer) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">Installer not found.</p>
      </PageContainer>
    );
  }

  const slots = (availability as { calendarSlots?: Array<{ date: string; status: string }> })?.calendarSlots ?? [];
  const stats = analytics as {
    winRate?: number;
    bids?: Array<{ _id: string; count: number }>;
    bookings?: Array<{ _id: string; count: number; revenue?: number }>;
  } | undefined;

  return (
    <PageContainer>
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Marketplace
      </Link>

      <div className="panel-card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-solar flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {installer.businessName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{installer.businessName}</h1>
              {installer.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-solar-500/15 text-solar-500">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
              {installer.isFeatured && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-energy-400/15 text-energy-400">Featured</span>
              )}
            </div>
            {installer.description && (
              <p className="text-sm text-muted-foreground mt-2">{installer.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {installer.avgRating?.toFixed(1)} ({installer.totalReviews} reviews)
              </span>
              <span className="text-muted-foreground">{installer.totalProjects} projects</span>
              {stats?.winRate != null && (
                <span className="text-solar-500">{stats.winRate}% bid win rate</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end shrink-0">
            <button
              type="button"
              onClick={() => setShowRequest(true)}
              className="px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90"
            >
              Request quotation
            </button>
            <Link
              href={`/marketplace/leads?installer=${installerId}`}
              className="px-4 py-2 rounded-lg border border-border text-sm text-center hover:bg-accent"
            >
              View leads
            </Link>
          </div>
        </div>

        {installer.serviceAreas && installer.serviceAreas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
            {installer.serviceAreas.map((a) => (
              <span key={a} className="text-xs bg-accent px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors',
              tab === t ? 'border-solar-500 text-solar-500' : 'border-transparent text-muted-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="panel-card p-5 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Contractor analytics
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Open leads</dt>
                <dd className="font-semibold">{(stats as { leads?: { openMarketplaceLeads?: number } })?.leads?.openMarketplaceLeads ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Win rate</dt>
                <dd className="font-semibold">{stats?.winRate ?? 0}%</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Price range</dt>
                <dd className="font-semibold">
                  {installer.priceRangeMin
                    ? `${formatCurrency(installer.priceRangeMin)} – ${formatCurrency(installer.priceRangeMax ?? 0)}`
                    : 'On request'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Specializations</dt>
                <dd className="font-semibold capitalize">{installer.specializations?.join(', ') || '—'}</dd>
              </div>
            </dl>
          </div>
          <div className="panel-card p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-solar-500" /> Trust & verification
            </h2>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                {installer.isVerified ? <BadgeCheck className="w-4 h-4 text-solar-500" /> : <Shield className="w-4 h-4" />}
                {installer.isVerified ? 'DOE-aligned installer verification' : 'Verification pending'}
              </li>
              <li>Escrow-ready bookings supported on platform</li>
              <li>In-app chat on every lead thread</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'Portfolio' && (
        <div className="grid md:grid-cols-2 gap-4">
          {(installer.portfolio ?? []).map((p, i) => (
            <div key={i} className="panel-card p-5">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-solar-500 mt-1">{p.systemSizeKw} kW system</p>
              {p.clientTestimonial && (
                <p className="text-sm text-muted-foreground mt-3 italic">&ldquo;{p.clientTestimonial}&rdquo;</p>
              )}
            </div>
          ))}
          {(!installer.portfolio || installer.portfolio.length === 0) && (
            <p className="text-sm text-muted-foreground">No portfolio items yet.</p>
          )}
        </div>
      )}

      {tab === 'Reviews' && (
        <div className="space-y-3">
          {(installer.reviews ?? []).map((r, i) => (
            <div key={i} className="panel-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn('w-3.5 h-3.5', s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted')} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {r.reviewerId?.firstName} {r.reviewerId?.lastName}
                </span>
              </div>
              <p className="text-sm">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'Certifications' && (
        <div className="space-y-3">
          {(installer.certifications ?? []).map((c, i) => (
            <div key={i} className="panel-card p-4 flex gap-3">
              <Award className="w-8 h-8 text-solar-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">Issued by {c.issuedBy}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Availability' && (
        <div className="panel-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4" /> Availability calendar
          </h2>
          <div className="grid grid-cols-7 gap-1.5">
            {slots.slice(0, 21).map((s) => (
              <div
                key={s.date}
                className={cn(
                  'text-center p-2 rounded-lg text-xs',
                  s.status === 'available' && 'bg-solar-500/15 text-solar-500',
                  s.status === 'booked' && 'bg-destructive/10 text-destructive',
                  s.status === 'busy' && 'bg-muted text-muted-foreground',
                )}
              >
                <div className="font-medium">{s.date.slice(8)}</div>
                <div className="capitalize opacity-70">{s.status}</div>
              </div>
            ))}
          </div>
          {slots.length === 0 && <p className="text-sm text-muted-foreground">No calendar slots published.</p>}
        </div>
      )}

      {showRequest && (
        <RequestLeadModal
          installerId={installerId}
          installerName={installer.businessName}
          onClose={() => setShowRequest(false)}
        />
      )}
    </PageContainer>
  );
}
