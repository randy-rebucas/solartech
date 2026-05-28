'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, Shield, BadgeCheck, Search, ChevronRight, AlertCircle, Gavel, Plus } from 'lucide-react';
import { useInstallers } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/layout/page-container';

/** Cities aligned with demo seed serviceAreas (API uses partial match). */
const CITY_OPTIONS = [
  'Metro Manila',
  'Makati',
  'Quezon City',
  'Laguna',
  'Cebu',
  'Davao',
  'Iloilo',
] as const;

type InstallerRow = {
  _id?: string;
  id?: string;
  businessName?: string;
  description?: string;
  serviceAreas?: string[];
  isVerified?: boolean;
  isFeatured?: boolean;
  avgRating?: number;
  totalProjects?: number;
  totalReviews?: number;
};

function installerId(row: InstallerRow): string {
  const id = row._id ?? row.id;
  return typeof id === 'string' ? id : String(id ?? row.businessName ?? Math.random());
}

function extractInstallers(data: unknown): InstallerRow[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null && 'data' in data) {
    const inner = (data as { data: unknown }).data;
    return Array.isArray(inner) ? inner : [];
  }
  return [];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('w-3.5 h-3.5', i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">({rating.toFixed(1)})</span>
    </div>
  );
}

export function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const { data, isLoading, isError, error, refetch } = useInstallers({ city: city || undefined });
  const installers = extractInstallers(data);

  const filtered = search
    ? installers.filter((i) =>
        (i.businessName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        i.serviceAreas?.some((a) => a.toLowerCase().includes(search.toLowerCase())),
      )
    : installers;

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Installer Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Profiles · reviews · bidding · chat · escrow-ready bookings
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/marketplace/leads"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            <Gavel className="w-4 h-4" /> Lead management
          </Link>
          <Link
            href="/marketplace/leads"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Request quote
          </Link>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search installers or locations…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40"
          />
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40 min-w-[10rem]"
        >
          <option value="">All areas</option>
          {CITY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="panel-card p-4 flex items-start gap-3 border-destructive/40 bg-destructive/5">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Could not load installers</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Check that the API is running on port 4000.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs font-medium text-solar-500 hover:underline flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filtered.length} installers found</span>
        <span className="flex items-center gap-1.5 text-solar-500">
          <Shield className="w-3.5 h-3.5" />
          {filtered.filter((i) => i.isVerified).length} verified
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-56 rounded-xl bg-accent/50 animate-pulse" />)}
        </div>
      ) : !isError && filtered.length === 0 ? (
        <div className="panel-card p-12 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="font-medium">No installers found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {city ? `No installers listed for “${city}”.` : 'No installer profiles in the database yet.'}
          </p>
          {city && (
            <button
              type="button"
              onClick={() => setCity('')}
              className="mt-4 text-sm text-solar-500 hover:underline"
            >
              Show all areas
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((installer) => (
            <motion.div
              key={installerId(installer)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="interactive-card p-5 rounded-xl group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-solar flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {installer.businessName?.[0] ?? 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm truncate">{installer.businessName}</h3>
                    {installer.isVerified && <BadgeCheck className="w-4 h-4 text-energy-400 flex-shrink-0" />}
                    {installer.isFeatured && (
                      <span className="text-xs bg-solar-500/20 text-solar-500 px-1.5 py-0.5 rounded-full">Featured</span>
                    )}
                  </div>
                  <StarRating rating={installer.avgRating ?? 0} />
                </div>
              </div>

              {installer.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{installer.description}</p>
              )}

              {installer.serviceAreas && installer.serviceAreas.length > 0 && (
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  {installer.serviceAreas.slice(0, 3).map((area) => (
                    <span key={area} className="text-xs bg-accent px-2 py-0.5 rounded-full">{area}</span>
                  ))}
                  {installer.serviceAreas.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{installer.serviceAreas.length - 3}</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
                <div>
                  <p className="text-sm font-bold">{installer.totalProjects ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{installer.totalReviews ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-solar-500">{installer.avgRating?.toFixed(1) ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>

              <Link
                href={`/marketplace/${installerId(installer)}`}
                className="mt-4 w-full py-2 rounded-lg border border-solar-500/40 text-solar-500 text-xs font-medium hover:bg-solar-500/10 transition-colors flex items-center justify-center gap-1"
              >
                View Profile <ChevronRight className="w-3 h-3" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
