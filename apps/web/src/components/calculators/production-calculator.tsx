'use client';

import { useMemo, useState } from 'react';
import { calculateProduction, PROVINCE_PSH } from '@/lib/solar-calculator';
import { formatKwh, formatNumber } from '@/lib/utils';
import { CalculatorField, ResultCard, inputClass, selectClass } from './calculator-field';

export function ProductionCalculator() {
  const [systemKw, setSystemKw] = useState(5);
  const [provinceKey, setProvinceKey] = useState('metro_manila');

  const result = useMemo(
    () => calculateProduction({ systemKw, provinceKey }),
    [systemKw, provinceKey],
  );

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-4 panel-card p-6 rounded-2xl">
        <h3 className="font-semibold">Array specs</h3>
        <CalculatorField label="System DC capacity (kW)">
          <input
            type="number"
            min={0.5}
            step={0.1}
            value={systemKw}
            onChange={(e) => setSystemKw(Number(e.target.value))}
            className={inputClass}
          />
        </CalculatorField>
        <CalculatorField label="Location">
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
        <p className="text-xs text-muted-foreground">
          Uses {result.peakSunHours} peak sun hours/day and 78% performance ratio.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ResultCard label="Daily output" value={formatKwh(result.dailyKwh)} highlight />
        <ResultCard label="Monthly output" value={formatKwh(result.monthlyKwh)} />
        <ResultCard label="Annual output" value={formatKwh(result.annualKwh)} highlight />
        <ResultCard label="CO₂ avoided / year" value={`${formatNumber(result.co2KgPerYear)} kg`} />
      </div>
    </div>
  );
}
