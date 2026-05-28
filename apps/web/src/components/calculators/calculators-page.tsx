'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Battery, Calculator, LineChart, Sun, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SystemSizingCalculator } from './system-sizing-calculator';
import { RoiCalculator } from './roi-calculator';
import { BatteryCalculator } from './battery-calculator';
import { ProductionCalculator } from './production-calculator';

const TABS = [
  { id: 'sizing', label: 'System Sizing', icon: Sun, desc: 'Panels, cost & payback from your bill' },
  { id: 'roi', label: 'ROI & Payback', icon: LineChart, desc: '25-year savings projection' },
  { id: 'battery', label: 'Battery Backup', icon: Battery, desc: 'kWh needed for outage hours' },
  { id: 'production', label: 'Energy Output', icon: Zap, desc: 'Daily & annual kWh by location' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function CalculatorsPage() {
  const [tab, setTab] = useState<TabId>('sizing');
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-solar-500/10 text-solar-500 border border-solar-500/20 text-xs font-medium mb-4">
          <Calculator className="w-3.5 h-3.5" />
          Free tools
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Solar Calculators</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Physics-based estimates for the Philippines. No login required — use results in your{' '}
          <Link href="/diy" className="text-solar-500 hover:underline">
            DIY guide
          </Link>{' '}
          or{' '}
          <Link href="/register" className="text-solar-500 hover:underline">
            save a quotation
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                tab === t.id
                  ? 'border-solar-500/40 bg-solar-500/10 ring-1 ring-solar-500/20'
                  : 'border-border hover:bg-accent/50',
              )}
            >
              <Icon
                className={cn('w-5 h-5 mb-2', tab === t.id ? 'text-solar-500' : 'text-muted-foreground')}
              />
              <p className="font-semibold text-sm">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold">{active.label}</h2>
        <p className="text-sm text-muted-foreground">{active.desc}</p>
      </div>

      {tab === 'sizing' && <SystemSizingCalculator />}
      {tab === 'roi' && <RoiCalculator />}
      {tab === 'battery' && <BatteryCalculator />}
      {tab === 'production' && <ProductionCalculator />}

      <p className="text-center text-xs text-muted-foreground mt-12 max-w-2xl mx-auto">
        Calculations are estimates only. Actual production depends on weather, shading, equipment, and
        installation quality. For licensed design and net metering, work with a certified installer.
      </p>
    </div>
  );
}
