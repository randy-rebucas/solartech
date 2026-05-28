'use client';

import type { QuotationCalcOutput } from '@/lib/quotation-analytics';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Line,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { QuotationAnalytics } from '@/lib/quotation-analytics';
import { financialChartData } from '@/lib/quotation-analytics';

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 11,
};

export function EnergyOffsetChart({ analytics }: { analytics: QuotationAnalytics }) {
  return (
    <div className="panel-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Energy offset</h3>
        <span className="text-xs text-solar-500 font-medium">{analytics.energyOffsetPercent}% annual offset</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={analytics.energyOffsetMonthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="consumption" name="Consumption (kWh)" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[2, 2, 0, 0]} />
          <Bar dataKey="solar" name="Solar (kWh)" fill="#22c55e" radius={[2, 2, 0, 0]} />
          <Line type="monotone" dataKey="offsetPercent" name="Offset %" stroke="#f59e0b" strokeWidth={2} dot={false} yAxisId={0} />
        </ComposedChart>
      </ResponsiveContainer>
      {analytics.roofLimited && (
        <p className="text-xs text-amber-500 mt-2">System size limited by available roof area.</p>
      )}
    </div>
  );
}

export function FinancialForecastChart({
  analytics,
  totalCost,
}: {
  analytics: QuotationAnalytics;
  totalCost: number;
}) {
  const data = financialChartData(analytics).map((d) => ({ ...d, cost: totalCost }));

  return (
    <div className="panel-card p-5">
      <h3 className="text-sm font-semibold mb-3">25-year financial forecast</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Area type="monotone" dataKey="cumulative" name="Cumulative savings" stroke="#22c55e" fill="url(#finGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="net" name="Net position" stroke="#a855f7" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
          <Area type="monotone" dataKey="cost" name="System cost" stroke="#3b82f6" fill="none" strokeDasharray="5 5" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProductionEstimateChart({ analytics }: { analytics: QuotationAnalytics }) {
  return (
    <div className="panel-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Solar production estimate</h3>
        <span className="text-xs text-muted-foreground">{analytics.peakSunHoursUsed} PSH</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={analytics.monthlyProduction} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} kWh`, 'Production']} />
          <Bar dataKey="kwh" name="kWh" fill="#22c55e" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NetMeteringCard({ analytics }: { analytics: QuotationAnalytics }) {
  const nm = analytics.netMetering;
  return (
    <div className="panel-card p-5">
      <h3 className="text-sm font-semibold mb-3">Net metering estimate</h3>
      {nm.eligible ? (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Bill reduction</dt>
            <dd className="font-semibold text-solar-500">~{nm.estimatedBillReductionPercent}%</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Export (est./yr)</dt>
            <dd className="font-semibold">{nm.estimatedExportKwhPerYear.toLocaleString()} kWh</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Credit (est./yr)</dt>
            <dd className="font-semibold">{formatCurrency(nm.estimatedAnnualCreditPhp)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="font-semibold text-emerald-500">Eligible</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">{nm.notes}</p>
      )}
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{nm.notes}</p>
    </div>
  );
}

export function EquipmentRecommendationsCard({
  analytics,
  equipment,
}: {
  analytics: QuotationAnalytics;
  equipment?: QuotationCalcOutput['equipment'];
}) {
  return (
    <div className="panel-card p-5 space-y-4">
      <h3 className="text-sm font-semibold">Equipment & sizing</h3>
      <div className="p-3 rounded-lg bg-accent/50 text-sm">
        <p className="font-medium">Inverter: {analytics.inverterRecommendation.brand} {analytics.inverterRecommendation.model}</p>
        <p className="text-xs text-muted-foreground mt-1">{analytics.inverterRecommendation.rationale}</p>
      </div>
      {analytics.batteryRecommendation && (
        <div className="p-3 rounded-lg bg-accent/50 text-sm">
          <p className="font-medium">
            Battery: {analytics.batteryRecommendation.brand} {analytics.batteryRecommendation.model} ·{' '}
            {analytics.batteryRecommendation.capacityKwh} kWh ({analytics.batteryRecommendation.units} units)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Est. {formatCurrency(analytics.batteryRecommendation.estimatedCost)}
          </p>
        </div>
      )}
      {analytics.roofEstimate && (
        <p className="text-xs text-muted-foreground">
          Roof: {analytics.roofEstimate.areaSqm} m² · {analytics.roofEstimate.panelsUsed}/{analytics.roofEstimate.maxPanels} panels (
          {analytics.roofEstimate.utilizationPercent}% utilization)
        </p>
      )}
      {equipment && equipment.length > 0 && (
        <ul className="space-y-2 border-t border-border pt-3">
          {equipment.map((eq, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="capitalize">{eq.type}: {eq.brand} {eq.model}</span>
              <span className="font-medium">{formatCurrency(eq.totalPrice)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProposalSummaryCard({
  summary,
  notes,
}: {
  summary?: QuotationCalcOutput['proposalSummary'];
  notes?: string;
}) {
  if (!summary && !notes) return null;
  return (
    <div className="panel-card p-5">
      <h3 className="text-sm font-semibold mb-3">Proposal summary</h3>
      {summary && (
        <div className="space-y-2 text-sm mb-4">
          <p className="font-medium">{summary.headline}</p>
          <p className="text-muted-foreground">{summary.systemOverview}</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
            {summary.financialHighlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <p className="text-xs text-solar-500">{summary.productionNote}</p>
        </div>
      )}
      {notes && (
        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">AI consultant narrative</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}
