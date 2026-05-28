'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  useCarbonReport,
  useEnergyReport,
  useHourlyProfile,
  useAiMonitoring,
} from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import {
  BarChart2, Zap, Leaf, TrendingUp, Download, Calendar, Activity, AlertTriangle,
  Gauge, CloudSun, Lightbulb, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { AnalyticsRange } from '@/lib/analytics-range';
import { formatCurrency, formatKwh } from '@/lib/utils';

const ranges: AnalyticsRange[] = ['7d', '30d', '90d', '1y'];

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const { data: report, isLoading: loadingEnergy } = useEnergyReport(range);
  const { data: carbon, isLoading: loadingCarbon } = useCarbonReport(range);
  const { data: hourly } = useHourlyProfile(range);
  const aiDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const { data: ai, isLoading: loadingAi, isError: aiError } = useAiMonitoring(aiDays);

  const dailyEnergy = useMemo(
    () => (report?.daily ?? []).map((d: { _id: string; energyKwh?: number }) => ({
      date: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      produced: Math.round(d.energyKwh ?? 0),
      consumed: 0,
    })),
    [report],
  );

  const hourlyData = useMemo(
    () => (hourly ?? []).map((h: { _id: number; power?: number }) => ({
      hour: `${h._id}:00`,
      power: Math.round((h.power ?? 0) / 1000),
      forecast: Math.round((h.power ?? 0) / 1000 * 0.92),
    })),
    [hourly],
  );

  const monthlyCarbon = carbon?.monthly ?? [];

  const kpis = [
    {
      label: 'Energy Generated',
      value: report?.totalKwh != null ? formatKwh(report.totalKwh) : '—',
      icon: Zap,
      color: 'text-solar-400',
      delta: '',
    },
    {
      label: 'CO₂ Avoided',
      value: carbon?.co2SavedKg != null ? `${(carbon.co2SavedKg / 1000).toFixed(2)}t` : '—',
      icon: Leaf,
      color: 'text-emerald-400',
      delta: '',
    },
    {
      label: 'Peak Power',
      value: report?.peakKw != null ? `${report.peakKw.toFixed(1)} kW` : '—',
      icon: TrendingUp,
      color: 'text-blue-400',
      delta: '',
    },
    {
      label: 'Performance Ratio',
      value: report?.performanceRatio != null ? `${report.performanceRatio}%` : '—',
      icon: BarChart2,
      color: 'text-purple-400',
      delta: '',
    },
  ];

  const chartsLoading = loadingEnergy || loadingCarbon;
  const aiLoading = loadingAi;
  const flow = ai?.liveEnergyFlow;
  const flowData = flow ? [
    { name: 'Solar', value: flow.solarProductionW, color: '#f59e0b' },
    { name: 'Load', value: flow.loadDemandW, color: '#22c55e' },
    { name: 'Grid', value: flow.gridImportW, color: '#ef4444' },
    { name: 'Battery', value: flow.batteryChargeW, color: '#3b82f6' },
  ] : [];
  const consumptionTrend = (ai?.consumptionPrediction.hourlyTrend ?? []).map((p) => ({
    hour: `${p.hour}:00`,
    loadKw: Math.round((p.avgLoadW / 1000) * 100) / 100,
  }));
  const anomalyRows = ai?.anomalies ?? [];
  const recommendations = ai?.smartRecommendations ?? [];

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Energy Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time production, anomalies, predictions, peak demand, savings & carbon
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-accent rounded-lg p-1">
            {ranges.map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${range === r ? 'bg-solar-500 text-white' : 'hover:bg-accent/80'}`}>
                {r}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'AI Efficiency Score',
            value: ai?.efficiencyScoring ? `${ai.efficiencyScoring.score} (${ai.efficiencyScoring.grade})` : '—',
            icon: Gauge,
            color: 'text-cyan-400',
          },
          {
            label: 'Inverter Fault Detections',
            value: ai?.inverterFaultsDetected ?? '—',
            icon: AlertTriangle,
            color: 'text-red-400',
          },
          {
            label: 'Predicted 24h Consumption',
            value: ai?.consumptionPrediction ? `${ai.consumptionPrediction.next24hKwh} kWh` : '—',
            icon: Activity,
            color: 'text-orange-400',
          },
          {
            label: 'Forecast Savings (30d)',
            value: ai?.forecastSavings ? formatCurrency(ai.forecastSavings.next30DaysPhp) : '—',
            icon: TrendingUp,
            color: 'text-emerald-400',
          },
        ].map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <p className="text-lg font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-card p-6">
          <h3 className="font-semibold mb-4">Live Energy Flow</h3>
          {aiLoading || !flow ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading live flow…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Solar Production</p>
                  <p className="text-lg font-semibold text-yellow-400">{Math.round(flow.solarProductionW)} W</p>
                </div>
                <div className="rounded-lg bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Load Demand</p>
                  <p className="text-lg font-semibold text-green-400">{Math.round(flow.loadDemandW)} W</p>
                </div>
                <div className="rounded-lg bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Grid Import</p>
                  <p className="text-lg font-semibold text-red-400">{Math.round(flow.gridImportW)} W</p>
                </div>
                <div className="rounded-lg bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Battery Charge</p>
                  <p className="text-lg font-semibold text-blue-400">{Math.round(flow.batteryChargeW)} W</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={flowData} dataKey="value" nameKey="name" outerRadius={70} innerRadius={38}>
                    {flowData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        <div className="panel-card p-6">
          <h3 className="font-semibold mb-4">Consumption Trends & Peak Demand</h3>
          {consumptionTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No trend data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={consumptionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="loadKw" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm mt-3 text-muted-foreground">
                Peak demand at <span className="text-foreground font-medium">{ai?.peakDemandAnalysis.peakHour}:00</span>{' '}
                ({Math.round((ai?.peakDemandAnalysis.peakDemandW ?? 0) / 1000)} kW)
              </p>
            </>
          )}
        </div>
      </div>

      <div className="panel-card p-6">
        <h3 className="font-semibold mb-4">Daily Energy Production (kWh)</h3>
        {chartsLoading ? (
          <p className="text-sm text-muted-foreground py-16 text-center">Loading energy data…</p>
        ) : dailyEnergy.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">No telemetry for this period. Connect devices to see production.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyEnergy}>
              <defs>
                <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend />
              <Area type="monotone" dataKey="produced" name="Produced" stroke="#f59e0b" fill="url(#engGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-card p-6">
          <h3 className="font-semibold mb-4">Hourly Power Profile (kW)</h3>
          {hourlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No hourly profile data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="forecast" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel-card p-6">
          <h3 className="font-semibold mb-4">Monthly Carbon Impact (kg CO₂)</h3>
          {monthlyCarbon.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No carbon data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyCarbon}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <defs>
                  <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <Bar dataKey="avoided" name="CO₂ Avoided" fill="url(#co2Grad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> AI Anomaly Detection</h3>
          {anomalyRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active anomalies detected.</p>
          ) : (
            <div className="space-y-2">
              {anomalyRows.map((a, i) => (
                <div key={`${a.type}-${i}`} className="rounded-lg bg-accent/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{a.type.replace(/_/g, ' ')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      a.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      a.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{a.severity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-400" /> Smart Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((r, i) => (
              <li key={i} className="text-sm rounded-lg bg-accent/50 p-3">{r}</li>
            ))}
            {!recommendations.length && <li className="text-sm text-muted-foreground">No recommendations yet.</li>}
          </ul>
        </div>
      </div>

      {aiError && (
        <div className="panel-card p-4 border border-amber-500/30 bg-amber-500/5 text-sm text-amber-600 dark:text-amber-400">
          AI monitoring data unavailable. Restart the API after pulling latest changes, then re-seed telemetry if charts are empty.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel-card p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><CloudSun className="w-4 h-4 text-cyan-400" /> Weather Correlation</h3>
          <p className="text-2xl font-bold">{ai?.weatherCorrelation ? ai.weatherCorrelation.coefficient.toFixed(3) : '—'}</p>
          <p className="text-sm text-muted-foreground mt-1">{ai?.weatherCorrelation.summary ?? 'No data yet.'}</p>
        </div>
        <div className="panel-card p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-emerald-400" /> Savings Tracker</h3>
          <p className="text-xl font-bold">{ai?.dashboardTrackers ? formatCurrency(ai.dashboardTrackers.savingsTracker.estimatedPhp) : '—'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {ai?.dashboardTrackers?.savingsTracker.totalKwh ?? '—'} kWh tracked in selected range
          </p>
        </div>
        <div className="panel-card p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-green-400" /> Carbon Reduction Tracker</h3>
          <p className="text-xl font-bold">{ai?.dashboardTrackers ? `${ai.dashboardTrackers.carbonReductionTracker.totalKg.toLocaleString()} kg` : '—'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Trees equivalent: {ai?.dashboardTrackers?.carbonReductionTracker.treesEquivalent ?? '—'}
          </p>
        </div>
      </div>

      <div className="panel-card p-6">
        <h3 className="font-semibold mb-3">Predicted maintenance risk</h3>
        {ai?.maintenancePrediction ? (
          <>
            <p className={`text-2xl font-bold ${
              ai.maintenancePrediction.level === 'high' ? 'text-red-400' :
              ai.maintenancePrediction.level === 'medium' ? 'text-yellow-400' : 'text-solar-500'
            }`}>
              {ai.maintenancePrediction.riskScore}% ({ai.maintenancePrediction.level})
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on temperature trends, open anomalies, and efficiency score.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No maintenance risk score yet.</p>
        )}
      </div>

      <div className="panel-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Scheduled Reports</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-accent hover:bg-accent/80">
            <Calendar className="w-3.5 h-3.5" /> Schedule New
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Report scheduling is not configured yet. Export charts manually for now.</p>
      </div>
    </PageContainer>
  );
}
