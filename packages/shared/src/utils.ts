import { SOLAR_CONSTANTS } from './constants';

export function calculateSystemSize(monthlyKwh: number, peakSunHours: number): number {
  const dailyKwh = monthlyKwh / 30;
  return parseFloat(
    (dailyKwh / (peakSunHours * SOLAR_CONSTANTS.PERFORMANCE_RATIO)).toFixed(2),
  );
}

export function calculateAnnualProduction(systemKw: number, peakSunHours: number): number {
  return parseFloat(
    (systemKw * peakSunHours * 365 * SOLAR_CONSTANTS.PERFORMANCE_RATIO).toFixed(0),
  );
}

export function calculatePaybackPeriod(
  totalCost: number,
  annualSavings: number,
): number {
  if (annualSavings <= 0) return Infinity;
  return parseFloat((totalCost / annualSavings).toFixed(1));
}

export function calculateROI(
  totalCost: number,
  annualSavings: number,
  years = SOLAR_CONSTANTS.SYSTEM_LIFESPAN_YEARS,
): number {
  let totalSavings = 0;
  for (let i = 0; i < years; i++) {
    totalSavings += annualSavings * Math.pow(1 - SOLAR_CONSTANTS.ANNUAL_DEGRADATION_RATE, i);
  }
  return parseFloat((((totalSavings - totalCost) / totalCost) * 100).toFixed(1));
}

export function calculateCO2Reduction(annualKwh: number): number {
  return parseFloat((annualKwh * SOLAR_CONSTANTS.CO2_KG_PER_KWH).toFixed(0));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}

export function formatCurrency(amount: number, currency = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatKwh(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
  return `${kwh.toFixed(1)} kWh`;
}
