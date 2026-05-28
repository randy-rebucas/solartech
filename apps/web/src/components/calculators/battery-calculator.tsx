'use client';

import { useMemo, useState } from 'react';
import { calculateBatterySizing, type GridType } from '@/lib/solar-calculator';
import { formatCurrency } from '@/lib/utils';
import { CalculatorField, ResultCard, inputClass, selectClass } from './calculator-field';

export function BatteryCalculator() {
  const [dailyKwh, setDailyKwh] = useState(12);
  const [autonomyHours, setAutonomyHours] = useState(4);
  const [gridType, setGridType] = useState<GridType>('hybrid');

  const result = useMemo(
    () => calculateBatterySizing({ dailyKwh, autonomyHours, gridType }),
    [dailyKwh, autonomyHours, gridType],
  );

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-4 panel-card p-6 rounded-2xl">
        <h3 className="font-semibold">Backup requirements</h3>
        <CalculatorField label="Average daily consumption (kWh)" hint="Daily load you want backed up">
          <input
            type="number"
            min={1}
            step={0.5}
            value={dailyKwh}
            onChange={(e) => setDailyKwh(Number(e.target.value))}
            className={inputClass}
          />
        </CalculatorField>
        <CalculatorField label="Backup duration (hours)" hint="4h typical for brownouts; 8h+ off-grid">
          <input
            type="number"
            min={1}
            max={24}
            value={autonomyHours}
            onChange={(e) => setAutonomyHours(Number(e.target.value))}
            className={inputClass}
          />
        </CalculatorField>
        <CalculatorField label="System type">
          <select
            value={gridType}
            onChange={(e) => setGridType(e.target.value as GridType)}
            className={selectClass}
          >
            <option value="hybrid">Hybrid (grid + backup)</option>
            <option value="off_grid">Off-grid</option>
            <option value="on_grid">On-grid (rarely needs battery)</option>
          </select>
        </CalculatorField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 content-start">
        <ResultCard label="Required capacity" value={`${result.requiredKwh} kWh`} highlight />
        <ResultCard label="Battery units (4.8 kWh)" value={`${result.units}`} />
        <ResultCard label="Est. battery cost" value={formatCurrency(result.estimatedCost)} />
        <p className="sm:col-span-3 text-xs text-muted-foreground">
          Based on LFP modules (~4.8 kWh each). Add inverter hybrid capacity and licensed installation for
          safe AC coupling.
        </p>
      </div>
    </div>
  );
}
