'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  useSmartCityHeatmap,
  useSmartCityAdvancedAnalytics,
  useSmartCityOverview,
  useSmartCityProvinces,
  useSmartCitySummary,
  type ProvinceStat,
} from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { Zap, Sun, TrendingUp, Building2, Leaf, Loader2, MapPin, Trees, Gauge, PlugZap, AlertOctagon, Landmark } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/utils';

const SmartCityMap = dynamic(
  () => import('./smart-city-map').then((m) => m.SmartCityMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] rounded-xl border border-border bg-accent/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

type ProvinceRow = {
  name: string;
  systemCount: number;
  totalCapacityKw: number;
  co2Reduced: number;
  cities: string[];
};

function mapProvinces(raw: ProvinceStat[] | undefined): ProvinceRow[] {
  if (!raw?.length) return [];
  return raw
    .filter((p) => p._id)
    .map((p) => ({
      name: p._id as string,
      systemCount: p.count ?? 0,
      totalCapacityKw: Math.round(p.capacityKw ?? 0),
      co2Reduced: p.co2TonsPerYear ?? Math.round(((p.capacityKw ?? 0) * 1460 * 0.7) / 1000),
      cities: (p.cities ?? []).filter(Boolean),
    }));
}

export function SmartCityPage() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useSmartCitySummary();
  const { data: provincesRaw, isLoading: provincesLoading, isError: provincesError } = useSmartCityProvinces();
  const { data: overview, isLoading: overviewLoading } = useSmartCityOverview(selectedProvince ?? undefined);
  const { data: heatmap = [], isLoading: heatmapLoading } = useSmartCityHeatmap(selectedProvince ?? undefined);
  const { data: advanced, isLoading: advancedLoading } = useSmartCityAdvancedAnalytics(selectedProvince ?? undefined);

  const data = useMemo(() => mapProvinces(provincesRaw), [provincesRaw]);
  const selected = data.find((p) => p.name === selectedProvince);
  const maxSystems = Math.max(...data.map((p) => p.systemCount), 1);
  const isLoading = summaryLoading || provincesLoading;
  const hasError = summaryError || provincesError;

  const kpis = [
    { label: 'Total Systems', value: summary?.totalSystems != null ? formatNumber(summary.totalSystems) : '—', icon: Sun, color: 'text-solar-400' },
    { label: 'Total Capacity', value: summary?.totalCapacityKw != null ? `${(summary.totalCapacityKw / 1000).toFixed(1)} MW` : '—', icon: Zap, color: 'text-yellow-400' },
    { label: 'New This Month', value: summary?.newThisMonth != null ? formatNumber(summary.newThisMonth) : '—', icon: Building2, color: 'text-pink-400' },
    { label: 'Est. Annual Output', value: summary?.estimatedAnnualMwh != null ? `${summary.estimatedAnnualMwh} MWh` : '—', icon: TrendingUp, color: 'text-purple-400' },
    { label: 'CO₂ Avoided / yr', value: summary?.co2AvoidedTonsPerYear != null ? `${summary.co2AvoidedTonsPerYear}t` : '—', icon: Leaf, color: 'text-emerald-400' },
  ];

  const provinceOverviewKpis = selectedProvince && overview ? [
    { label: 'Installations', value: formatNumber(overview.totalInstallations), icon: Sun },
    { label: 'Capacity', value: `${(overview.totalCapacityKw / 1000).toFixed(2)} MW`, icon: Zap },
    { label: 'CO₂ saved', value: `${(overview.totalCo2SavedKg / 1000).toFixed(1)}t`, icon: Leaf },
    { label: 'Tree equivalent', value: formatNumber(overview.treesEquivalent), icon: Trees },
  ] : [];

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-bold">Smart City Energy Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Regional solar adoption, live map, and LGU energy data from active installations
        </p>
      </div>

      {hasError && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          Could not load smart city data. Ensure the API is running and you are signed in.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {kpis.map((k) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
                <k.icon className={`w-5 h-5 ${k.color} mb-2`} />
                <p className="text-xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="panel-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-solar-500" />
                Installation map
                {selectedProvince && (
                  <span className="text-sm font-normal text-muted-foreground">— {selectedProvince}</span>
                )}
              </h3>
              {selectedProvince && (
                <button
                  type="button"
                  onClick={() => setSelectedProvince(null)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
                >
                  Show all provinces
                </button>
              )}
            </div>
            {heatmapLoading ? (
              <div className="h-[420px] rounded-xl bg-accent/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : heatmap.length === 0 ? (
              <div className="h-[420px] rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center p-6">
                <MapPin className="w-10 h-10 text-muted-foreground opacity-40 mb-3" />
                <p className="text-sm text-muted-foreground max-w-md">
                  No geolocated active systems yet. Add systems with latitude, longitude, and province in{' '}
                  <Link href="/systems" className="text-solar-500 hover:underline">Solar Systems</Link>.
                </p>
              </div>
            ) : (
              <SmartCityMap
                heatmap={heatmap}
                geoJson={overview?.geoJson}
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="panel-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Provinces / Cities</h3>
              </div>
              <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
                {data.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">
                    No active systems with province data yet.
                  </p>
                ) : data.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedProvince(p.name === selectedProvince ? null : p.name)}
                    className={`w-full p-4 text-left hover:bg-accent/40 transition-colors ${selectedProvince === p.name ? 'bg-solar-500/10 border-l-2 border-solar-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.systemCount} systems</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5">
                      <div
                        className="bg-gradient-solar h-1.5 rounded-full"
                        style={{ width: `${Math.min((p.systemCount / maxSystems) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground">{(p.totalCapacityKw / 1000).toFixed(1)} MW</span>
                      <span className="text-xs text-emerald-400">{p.co2Reduced}t CO₂/yr</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 panel-card p-6">
              <h3 className="font-semibold mb-4">
                {selected ? `${selected.name} — Detail` : 'Solar Capacity by Province (kW)'}
              </h3>
              {data.length === 0 ? (
                <p className="text-sm text-muted-foreground py-16 text-center">
                  Add solar systems with province locations to populate this view.
                </p>
              ) : selected ? (
                <div className="space-y-4">
                  {overviewLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {provinceOverviewKpis.map((k) => (
                          <div key={k.label} className="bg-accent/40 rounded-xl p-3">
                            <k.icon className="w-4 h-4 text-solar-500 mb-1" />
                            <p className="text-xs text-muted-foreground">{k.label}</p>
                            <p className="text-lg font-bold mt-0.5">{k.value}</p>
                          </div>
                        ))}
                      </div>

                      {overview?.byCity && overview.byCity.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">By city / municipality</h4>
                          <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                            {overview.byCity.map((c) => (
                              <div key={c.city} className="flex justify-between px-3 py-2 text-sm">
                                <span>{c.city}</span>
                                <span className="text-muted-foreground">
                                  {c.count} systems · {(c.capacityKw / 1000).toFixed(2)} MW
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData(selected, maxSystems)}>
                          <PolarGrid stroke="rgba(255,255,255,0.05)" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                          <Radar name={selected.name} dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={data.slice(0, 12)} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}MW`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v: number) => [`${v.toLocaleString()} kW`, 'Capacity']} />
                    <defs>
                      <linearGradient id="capGrad" x1="1" y1="0" x2="0" y2="0">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="totalCapacityKw" fill="url(#capGrad)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-cyan-400" />
                Barangay Energy Analytics
              </h3>
              {advancedLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : !advanced?.byBarangay.length ? (
                <p className="text-sm text-muted-foreground">No barangay analytics yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={advanced.byBarangay.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Bar dataKey="avgDemandKw" name="Avg demand kW" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="outageEvents" name="Outages" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-solar-500" />
                Public Facility Monitoring
              </h3>
              {advancedLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : !advanced?.publicFacilities.length ? (
                <p className="text-sm text-muted-foreground">No facility data yet.</p>
              ) : (
                <div className="space-y-2">
                  {advanced.publicFacilities.map((f) => (
                    <div key={f.type} className="rounded-lg bg-accent/40 px-3 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize">{f.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{f.count} sites · {f.capacityKw} kW</p>
                      </div>
                      <span className="text-sm font-semibold">{f.productionKwh.toLocaleString()} kWh</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                Renewable & Carbon Statistics
              </h3>
              {advanced ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-accent/40 p-3">
                    <p className="text-xs text-muted-foreground">Solar adoption rate</p>
                    <p className="text-2xl font-bold">{advanced.renewableStats.solarAdoptionRate}%</p>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <p className="text-xs text-muted-foreground">Renewable production</p>
                    <p className="text-xl font-bold">{advanced.renewableStats.totalProductionKwh.toLocaleString()} kWh</p>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <p className="text-xs text-muted-foreground">Carbon avoided</p>
                    <p className="text-xl font-bold">{advanced.carbonAnalytics.annualEquivalentTons} tCO₂</p>
                    <p className="text-xs text-muted-foreground mt-1">~{advanced.carbonAnalytics.treesEquivalent} trees equivalent</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
            </div>

            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-400" />
                Grid Utilization Tracking
              </h3>
              {advanced ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Grid', value: advanced.gridUtilization.percentFromGrid },
                          { name: 'Renewable', value: 100 - advanced.gridUtilization.percentFromGrid },
                        ]}
                        innerRadius={45}
                        outerRadius={70}
                        dataKey="value"
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#22c55e" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-muted-foreground mt-2">
                    Estimated demand: {advanced.gridUtilization.estimatedDemandKwh.toLocaleString()} kWh
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No grid utilization data.</p>
              )}
            </div>

            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                Power Outage Tracking
              </h3>
              {advanced ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-accent/40 p-3">
                    <p className="text-xs text-muted-foreground">Outage events (7d)</p>
                    <p className="text-2xl font-bold text-red-400">{advanced.outageTracking.outageEvents}</p>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <p className="text-xs text-muted-foreground">Impacted barangays</p>
                    <p className="text-xl font-bold">{advanced.outageTracking.impactedBarangays}</p>
                  </div>
                  {!!advanced.byBarangay.length && (
                    <ResponsiveContainer width="100%" height={110}>
                      <LineChart data={advanced.byBarangay.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} hide />
                        <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <Line type="monotone" dataKey="outageEvents" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No outage history.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PlugZap className="w-4 h-4 text-violet-400" />
                EV Charging Analytics
              </h3>
              {advanced ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-accent/40 p-3">
                    <p className="text-xs text-muted-foreground">Charging sites</p>
                    <p className="text-xl font-bold mt-1">{advanced.evChargingAnalytics.chargingSites}</p>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <p className="text-xs text-muted-foreground">Sessions est.</p>
                    <p className="text-xl font-bold mt-1">{advanced.evChargingAnalytics.sessionsEstimate}</p>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <p className="text-xs text-muted-foreground">EV energy</p>
                    <p className="text-xl font-bold mt-1">{advanced.evChargingAnalytics.energyKwh.toLocaleString()} kWh</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No EV data yet.</p>
              )}
            </div>
            <div className="panel-card p-6">
              <h3 className="font-semibold mb-4">Smart Infrastructure Dashboard Targets</h3>
              {advanced?.targetSegments?.length ? (
                <div className="space-y-2">
                  {advanced.targetSegments.map((t) => (
                    <div key={t} className="rounded-lg bg-accent/40 px-3 py-2 text-sm">{t}</div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No segment data.</p>
              )}
            </div>
          </div>

          <div className="panel-card p-6">
            <h3 className="font-semibold mb-4">Solar Adoption Heatmap</h3>
            {data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No provincial data to display.</p>
            ) : (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {data.map((p) => {
                    const intensity = p.systemCount / maxSystems;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setSelectedProvince(p.name)}
                        title={`${p.name}: ${p.systemCount} systems, ${(p.totalCapacityKw / 1000).toFixed(1)} MW`}
                        className={`aspect-square rounded-lg transition-transform hover:scale-105 flex flex-col items-center justify-center p-1 text-[10px] leading-tight ${selectedProvince === p.name ? 'ring-2 ring-solar-500' : ''}`}
                        style={{ background: `rgba(245,158,11,${0.12 + intensity * 0.88})` }}
                      >
                        <span className="font-medium truncate w-full text-center">{p.name.split(' ')[0]}</span>
                        <span className="text-muted-foreground">{p.systemCount}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-xs text-muted-foreground">Low adoption</span>
                  <div className="flex gap-1 flex-1">
                    {[0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1].map((o) => (
                      <div key={o} className="flex-1 h-2 rounded" style={{ background: `rgba(245,158,11,${o})` }} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">High adoption</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}

function radarData(p: ProvinceRow, maxSystems: number) {
  const capMax = maxSystems * 10;
  return [
    { metric: 'Systems', value: Math.min((p.systemCount / maxSystems) * 100, 100) },
    { metric: 'Capacity', value: Math.min((p.totalCapacityKw / capMax) * 100, 100) },
    { metric: 'CO₂ Impact', value: Math.min((p.co2Reduced / 500) * 100, 100) },
    { metric: 'Avg Size', value: p.systemCount > 0 ? Math.min((p.totalCapacityKw / p.systemCount / 20) * 100, 100) : 0 },
    { metric: 'Share', value: Math.min((p.systemCount / maxSystems) * 100, 100) },
  ];
}
