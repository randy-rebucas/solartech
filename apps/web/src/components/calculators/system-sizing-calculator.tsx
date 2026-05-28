'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  calculateSystemSizing,
  billToMonthlyKwh,
  PROVINCE_PSH,
  type GridType,
} from '@/lib/solar-calculator';
import { formatCurrency, formatKwh, formatNumber } from '@/lib/utils';
import { CalculatorField, ResultCard, inputClass, selectClass } from './calculator-field';
import { AlertTriangle } from 'lucide-react';

export function SystemSizingCalculator() {
  const [monthlyBill, setMonthlyBill] = useState(3500);
  const [useBill, setUseBill] = useState(true);
  const [monthlyKwh, setMonthlyKwh] = useState(320);
  const [utilityRate, setUtilityRate] = useState(10.5);
  const [roofArea, setRoofArea] = useState(40);
  const [provinceKey, setProvinceKey] = useState('metro_manila');
  const [gridType, setGridType] = useState<GridType>('on_grid');
  const [includesBattery, setIncludesBattery] = useState(false);

  const effectiveKwh = useMemo(
    () => (useBill ? billToMonthlyKwh(monthlyBill, utilityRate) : monthlyKwh),
    [useBill, monthlyBill, utilityRate, monthlyKwh],
  );

  const result = useMemo(
    () =>
      calculateSystemSizing({
        monthlyKwh: effectiveKwh,
        utilityRate,
        roofArea,
        provinceKey,
        gridType,
        includesBattery,
      }),
    [effectiveKwh, utilityRate, roofArea, provinceKey, gridType, includesBattery],
  );

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-4 panel-card p-6 rounded-2xl">
        <h3 className="font-semibold">Your inputs</h3>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useBill}
            onChange={(e) => setUseBill(e.target.checked)}
            className="rounded border-border"
          />
          Estimate kWh from monthly bill
        </label>

        {useBill ? (
          <CalculatorField label="Monthly electric bill (₱)">
            <input
              type="number"
              min={0}
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(Number(e.target.value))}
              className={inputClass}
            />
          </CalculatorField>
        ) : (
          <CalculatorField label="Monthly consumption (kWh)">
            <input
              type="number"
              min={0}
              value={monthlyKwh}
              onChange={(e) => setMonthlyKwh(Number(e.target.value))}
              className={inputClass}
            />
          </CalculatorField>
        )}

        <CalculatorField label="Utility rate (₱/kWh)" hint="MERALCO residential ~₱10–12/kWh">
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={utilityRate}
            onChange={(e) => setUtilityRate(Number(e.target.value))}
            className={inputClass}
          />
        </CalculatorField>

        <p className="text-xs text-muted-foreground">
          Estimated usage: <strong>{formatNumber(effectiveKwh)} kWh/month</strong>
        </p>

        <CalculatorField label="Usable roof area (m²)">
          <input
            type="number"
            min={10}
            value={roofArea}
            onChange={(e) => setRoofArea(Number(e.target.value))}
            className={inputClass}
          />
        </CalculatorField>

        <CalculatorField label="Province / region">
          <select
            value={provinceKey}
            onChange={(e) => setProvinceKey(e.target.value)}
            className={selectClass}
          >
            {Object.entries(PROVINCE_PSH).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </CalculatorField>

        <CalculatorField label="Grid type">
          <select
            value={gridType}
            onChange={(e) => setGridType(e.target.value as GridType)}
            className={selectClass}
          >
            <option value="on_grid">On-grid (net metering)</option>
            <option value="hybrid">Hybrid (battery backup)</option>
            <option value="off_grid">Off-grid</option>
          </select>
        </CalculatorField>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includesBattery}
            onChange={(e) => setIncludesBattery(e.target.checked)}
            disabled={gridType === 'off_grid'}
            className="rounded border-border"
          />
          Include battery storage
        </label>
      </div>

      <div className="space-y-4">
        {result.roofLimited && (
          <div className="flex gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>Roof area limits panel count. Increase usable roof or consider ground mount.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <ResultCard label="System size" value={`${result.systemKw} kW`} highlight />
          <ResultCard label="Panels" value={`${result.numberOfPanels} × 550 W`} />
          <ResultCard label="Inverter" value={`${result.inverterKw} kW`} />
          {result.batteryKwh != null && (
            <ResultCard label="Battery" value={`${result.batteryKwh} kWh`} />
          )}
          <ResultCard label="Annual production" value={formatKwh(result.annualKwh)} />
          <ResultCard label="Monthly savings" value={formatCurrency(result.monthlySavings)} highlight />
          <ResultCard label="Estimated total cost" value={formatCurrency(result.totalCost)} />
          <ResultCard label="Payback" value={`${result.paybackYears} years`} />
          <ResultCard label="25-year ROI" value={`${result.roi25Percent}%`} />
          <ResultCard label="CO₂ offset / year" value={`${formatNumber(result.co2KgPerYear)} kg`} />
        </div>

        <p className="text-xs text-muted-foreground">
          Estimates use Philippine equipment pricing and {PROVINCE_PSH[provinceKey]?.psh ?? 4.5} peak sun
          hours.{' '}
          <Link href="/register" className="text-solar-500 hover:underline">
            Create a full quotation in SolarTech →
          </Link>
        </p>
      </div>
    </div>
  );
}
