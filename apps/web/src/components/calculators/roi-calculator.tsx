'use client';

import { useMemo, useState } from 'react';
import { calculateRoi } from '@/lib/solar-calculator';
import { formatCurrency } from '@/lib/utils';
import { CalculatorField, ResultCard, inputClass } from './calculator-field';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export function RoiCalculator() {
  const [totalCost, setTotalCost] = useState(280000);
  const [annualSavings, setAnnualSavings] = useState(42000);

  const result = useMemo(
    () => calculateRoi({ totalCost, annualSavings }),
    [totalCost, annualSavings],
  );

  const chartData = result.yearlyBreakdown.filter((_, i) => i % 2 === 0 || i === 24);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-4 panel-card p-6 rounded-2xl">
        <h3 className="font-semibold">Investment</h3>
        <CalculatorField label="Total installed cost (₱)" hint="Equipment + labor">
          <input
            type="number"
            min={0}
            value={totalCost}
            onChange={(e) => setTotalCost(Number(e.target.value))}
            className={inputClass}
          />
        </CalculatorField>
        <CalculatorField label="Expected annual savings (₱)" hint="From avoided grid energy">
          <input
            type="number"
            min={0}
            value={annualSavings}
            onChange={(e) => setAnnualSavings(Number(e.target.value))}
            className={inputClass}
          />
        </CalculatorField>
        <p className="text-xs text-muted-foreground">
          Tip: Run the System Sizing calculator first to estimate annual savings from production.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ResultCard label="Simple payback" value={`${result.paybackYears} years`} highlight />
          <ResultCard label="25-year total savings" value={formatCurrency(result.totalSavings)} />
          <ResultCard label="Net profit (25 yr)" value={formatCurrency(result.netProfit)} highlight />
          <ResultCard label="ROI" value={`${result.roiPercent}%`} />
        </div>

        <div className="panel-card p-4 rounded-2xl h-64">
          <p className="text-xs text-muted-foreground mb-2">Cumulative savings (with 0.5% degradation/yr)</p>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => `Year ${l}`} />
              <Area type="monotone" dataKey="cumulativeSavings" stroke="#22c55e" fill="#22c55e33" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground">
          Break-even around year {Math.ceil(result.paybackYears)}. Savings shown before financing costs.
        </p>
      </div>
    </div>
  );
}
