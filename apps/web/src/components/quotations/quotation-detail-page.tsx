'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Sun, User, Mail, Loader2, AlertTriangle,
  CheckCircle2, XCircle, Clock, RefreshCw, Battery, Download, Sparkles,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { useQuotation, usePatch } from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { formatCurrency, formatDate, formatDateTime, formatKwh, cn } from '@/lib/utils';
import {
  getQuotationStatusConfig,
  QUOTATION_APPROVAL_STATUS,
} from '@/lib/quotation-status';
import { ensureAnalytics, type QuotationCalcOutput } from '@/lib/quotation-analytics';
import { downloadQuotationPdf } from '@/lib/quotation-pdf';
import {
  EnergyOffsetChart,
  FinancialForecastChart,
  ProductionEstimateChart,
  NetMeteringCard,
  EquipmentRecommendationsCard,
  ProposalSummaryCard,
} from './quotation-widgets';

interface QuotationDetailPageProps {
  quotationId: string;
}

type ClientRef = { firstName?: string; lastName?: string; email?: string; phone?: string };

type QuotationOutput = QuotationCalcOutput;

type QuotationInput = {
  monthlyBill: number;
  monthlyKwh: number;
  roofArea: number;
  roofType: string;
  gridType: string;
  includesBattery: boolean;
  utilityRate: number;
  address: string;
  city: string;
  province?: string;
  latitude: number;
  longitude: number;
  currency?: string;
};

type QuotationDetail = {
  _id: string;
  status: string;
  input: QuotationInput;
  output?: QuotationOutput;
  notes?: string;
  validUntil?: string;
  createdAt?: string;
  updatedAt?: string;
  clientId?: ClientRef;
};

const GRID_LABELS: Record<string, string> = {
  on_grid: 'On-Grid (Net Metering)',
  off_grid: 'Off-Grid',
  hybrid: 'Hybrid',
};

export function QuotationDetailPage({ quotationId }: QuotationDetailPageProps) {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuotation(quotationId);
  const httpStatus = (error as AxiosError | null)?.response?.status;
  const statusMutation = usePatch<{ status: string }, unknown>([
    ['quotations'],
    ['quotations', quotationId],
  ]);

  const recalculateMutation = useMutation({
    mutationFn: () =>
      api.post<QuotationDetail>(`/api/v1/quotations/${quotationId}/recalculate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['quotations', quotationId] });
      refetch();
    },
  });

  const proposalMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/quotations/${quotationId}/proposal`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations', quotationId] });
      refetch();
    },
  });

  const quotation = data as QuotationDetail | undefined;
  const output = quotation?.output;
  const input = quotation?.input;
  const statusCfg = getQuotationStatusConfig(quotation?.status ?? 'draft');
  const StatusIcon = statusCfg.icon;
  const canApprove = quotation?.status === 'draft' || quotation?.status === 'pending';

  async function setStatus(status: (typeof QUOTATION_APPROVAL_STATUS)[number]) {
    await statusMutation.mutateAsync({
      url: `/api/v1/quotations/${quotationId}/status`,
      data: { status },
    });
    refetch();
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !quotation) {
    const forbidden = httpStatus === 403;
    const notFound = httpStatus === 404;
    return (
      <PageContainer>
        <Link
          href="/quotations"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to quotations
        </Link>
        <div className="panel-card p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="font-medium">
            {forbidden ? 'Access denied' : notFound ? 'Quotation not found' : 'Could not load quotation'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {forbidden
              ? 'You do not have permission to view this quotation.'
              : 'It may have been removed or the API is unavailable.'}
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!input) {
    return (
      <PageContainer>
        <Link href="/quotations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to quotations
        </Link>
        <div className="panel-card p-12 text-center text-sm text-muted-foreground">
          This quotation has no site data. Try recalculating or contact support.
        </div>
      </PageContainer>
    );
  }

  const client = quotation.clientId;
  const clientName = client
    ? [client.firstName, client.lastName].filter(Boolean).join(' ') || '—'
    : '—';
  const mapsUrl = `https://www.google.com/maps?q=${input.latitude},${input.longitude}`;

  const analytics = output ? ensureAnalytics(output, input.monthlyKwh) : null;

  function handlePdfExport() {
    if (!output || !input) return;
    downloadQuotationPdf(
      {
        address: input.address,
        city: input.city,
        province: input.province,
        monthlyBill: input.monthlyBill,
        monthlyKwh: input.monthlyKwh,
        utilityRate: input.utilityRate,
      },
      output,
      quotation?.notes,
      clientName !== '—' ? clientName : undefined,
    );
  }

  return (
    <PageContainer>
      <Link
        href="/quotations"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Solar Quotations
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn('p-3 rounded-xl shrink-0', statusCfg.bg)}>
            <StatusIcon className={cn('w-7 h-7', statusCfg.color)} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{input.address}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {[input.city, input.province].filter(Boolean).join(', ')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Created {quotation.createdAt ? formatDate(quotation.createdAt) : '—'}
              {quotation.validUntil ? ` · Valid until ${formatDate(quotation.validUntil)}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('px-3 py-1.5 rounded-full text-xs font-medium', statusCfg.color, statusCfg.bg)}>
            {statusCfg.label}
          </span>
          <button
            type="button"
            disabled={recalculateMutation.isPending}
            onClick={() => recalculateMutation.mutate()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-50"
          >
            {recalculateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Recalculate
          </button>
          <button
            type="button"
            disabled={proposalMutation.isPending || !output}
            onClick={() => proposalMutation.mutate()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-solar-500/40 text-solar-500 text-sm hover:bg-solar-500/10 disabled:opacity-50"
          >
            {proposalMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Regenerate proposal
          </button>
          {output && (
            <button
              type="button"
              onClick={handlePdfExport}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
          )}
          {canApprove && (
            <>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() => setStatus('approved')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-solar-500/15 text-solar-500 text-sm font-medium hover:bg-solar-500/25 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() => setStatus('rejected')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() => setStatus('expired')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-50"
              >
                <Clock className="w-4 h-4" /> Expire
              </button>
            </>
          )}
        </div>
      </div>

      {output && analytics ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'System Size', value: `${output.recommendedSystemSizeKw} kW`, color: 'text-solar-500' },
              { label: 'Total Cost', value: formatCurrency(output.totalCost), color: 'text-energy-400' },
              { label: 'Payback', value: `${output.paybackPeriodYears} yrs`, color: 'text-yellow-500' },
              { label: '25-Year ROI', value: `${output.roi25Years}%`, color: 'text-purple-400' },
              { label: 'Annual Production', value: formatKwh(output.estimatedAnnualProductionKwh), color: 'text-solar-500' },
              { label: 'Monthly Savings', value: formatCurrency(output.estimatedMonthlySavings), color: 'text-solar-500' },
              {
                label: 'CO₂ Saved / Year',
                value: `${output.co2ReductionKgPerYear.toLocaleString()} kg`,
                color: 'text-emerald-400',
              },
              {
                label: 'Panels',
                value: `${output.numberOfPanels} × ${output.panelWattage}W`,
                color: 'text-energy-400',
              },
            ].map((kpi) => (
              <div key={kpi.label} className="stat-card text-center">
                <p className={cn('text-lg font-bold', kpi.color)}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EnergyOffsetChart analytics={analytics} />
                <ProductionEstimateChart analytics={analytics} />
              </div>
              <FinancialForecastChart analytics={analytics} totalCost={output.totalCost} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NetMeteringCard analytics={analytics} />
                <EquipmentRecommendationsCard analytics={analytics} equipment={output.equipment} />
              </div>
              <ProposalSummaryCard summary={output.proposalSummary} notes={quotation.notes} />
            </motion.div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel-card p-6"
              >
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-muted-foreground" /> Site & consumption
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Monthly bill</dt>
                    <dd className="font-medium">{formatCurrency(input.monthlyBill)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Monthly usage</dt>
                    <dd className="font-medium">{formatKwh(input.monthlyKwh)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Utility rate</dt>
                    <dd className="font-medium">₱{input.utilityRate}/kWh</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Roof</dt>
                    <dd className="font-medium capitalize">
                      {input.roofArea} m² · {input.roofType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Grid type</dt>
                    <dd className="font-medium">{GRID_LABELS[input.gridType] ?? input.gridType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Battery</dt>
                    <dd className="font-medium flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5" />
                      {input.includesBattery ? 'Included' : 'Not included'}
                      {output.batteryCapacityKwh ? ` · ${output.batteryCapacityKwh} kWh` : ''}
                    </dd>
                  </div>
                  {analytics.peakSunHoursUsed && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Peak sun hours</dt>
                      <dd className="font-medium">{analytics.peakSunHoursUsed} h/day</dd>
                    </div>
                  )}
                  {output.netMeteringEligible && (
                    <div className="text-solar-500 text-xs font-medium">
                      Net metering eligible · ~{analytics.netMetering.estimatedBillReductionPercent}% bill reduction
                    </div>
                  )}
                </dl>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-sm text-solar-500 hover:underline"
                >
                  View on map
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="panel-card p-6"
              >
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" /> Client
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Name</dt>
                    <dd className="font-medium">{clientName}</dd>
                  </div>
                  {client?.email && (
                    <div>
                      <dt className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </dt>
                      <dd className="mt-0.5 break-all">{client.email}</dd>
                    </div>
                  )}
                </dl>
              </motion.div>
            </div>
          </div>
        </>
      ) : (
        <div className="panel-card p-8 text-center text-muted-foreground text-sm">
          No calculation output yet. Use Recalculate to generate estimates.
        </div>
      )}

      {quotation.updatedAt && (
        <p className="text-xs text-muted-foreground text-right">
          Last updated {formatDateTime(quotation.updatedAt)}
        </p>
      )}
    </PageContainer>
  );
}
