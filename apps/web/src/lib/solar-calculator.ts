import { SOLAR_CONSTANTS } from '@solartech/shared';

export const PROVINCE_PSH: Record<string, { label: string; psh: number }> = {
  default: { label: 'Philippines (average)', psh: 4.5 },
  metro_manila: { label: 'Metro Manila / NCR', psh: 4.5 },
  cebu: { label: 'Cebu', psh: 4.8 },
  davao: { label: 'Davao', psh: 5.1 },
  iloilo: { label: 'Iloilo', psh: 4.9 },
  laguna: { label: 'Laguna', psh: 4.4 },
  batangas: { label: 'Batangas', psh: 4.6 },
  pampanga: { label: 'Pampanga', psh: 4.7 },
  cagayan: { label: 'Cagayan de Oro', psh: 5.0 },
};

const PANEL_WATTAGE = 550;
const PANEL_AREA_SQM = 2.1;
const PANEL_PRICE = 8500;
const INVERTER_PRICE_PER_KW = 4500;
const BATTERY_KWH_PRICE = 18000;
const BATTERY_UNIT_KWH = 4.8;
const INSTALLATION_PER_KW = 15000;
const MOUNTING_PER_PANEL = 800;

export type GridType = 'on_grid' | 'hybrid' | 'off_grid';

export interface SystemSizingInput {
  monthlyKwh: number;
  utilityRate: number;
  roofArea: number;
  provinceKey: string;
  gridType: GridType;
  includesBattery: boolean;
}

export interface SystemSizingResult {
  systemKw: number;
  numberOfPanels: number;
  inverterKw: number;
  batteryKwh?: number;
  annualKwh: number;
  monthlySavings: number;
  annualSavings: number;
  equipmentCost: number;
  installationCost: number;
  totalCost: number;
  paybackYears: number;
  roi25Percent: number;
  co2KgPerYear: number;
  roofLimited: boolean;
}

export interface RoiInput {
  totalCost: number;
  annualSavings: number;
  lifespanYears?: number;
}

export interface RoiResult {
  paybackYears: number;
  totalSavings: number;
  netProfit: number;
  roiPercent: number;
  yearlyBreakdown: { year: number; cumulativeSavings: number }[];
}

export interface BatterySizingInput {
  dailyKwh: number;
  autonomyHours: number;
  gridType: GridType;
}

export interface BatterySizingResult {
  requiredKwh: number;
  units: number;
  estimatedCost: number;
}

export interface ProductionInput {
  systemKw: number;
  provinceKey: string;
}

export interface ProductionResult {
  dailyKwh: number;
  monthlyKwh: number;
  annualKwh: number;
  co2KgPerYear: number;
  peakSunHours: number;
}

function getPsh(provinceKey: string): number {
  return PROVINCE_PSH[provinceKey]?.psh ?? PROVINCE_PSH.default.psh;
}

export function billToMonthlyKwh(monthlyBill: number, utilityRate: number): number {
  if (utilityRate <= 0) return 0;
  return Math.round(monthlyBill / utilityRate);
}

export function calculateSystemSizing(input: SystemSizingInput): SystemSizingResult {
  const psh = getPsh(input.provinceKey);
  const pr = SOLAR_CONSTANTS.PERFORMANCE_RATIO;
  const dailyKwh = input.monthlyKwh / 30;
  const targetKw = dailyKwh / (psh * pr);

  const maxPanelsByRoof = Math.floor(input.roofArea / PANEL_AREA_SQM);
  const panelsNeeded = Math.ceil((targetKw * 1000) / PANEL_WATTAGE);
  const numberOfPanels = Math.min(panelsNeeded, maxPanelsByRoof);
  const roofLimited = panelsNeeded > maxPanelsByRoof;

  const systemKw = parseFloat(((numberOfPanels * PANEL_WATTAGE) / 1000).toFixed(2));
  const inverterKw = parseFloat((systemKw * 1.1).toFixed(1));

  let batteryKwh: number | undefined;
  let batteryCost = 0;
  if (input.includesBattery || input.gridType !== 'on_grid') {
    const autonomyHours = input.gridType === 'off_grid' ? 8 : 4;
    batteryKwh = parseFloat((dailyKwh * (autonomyHours / 24) * 1.2).toFixed(1));
    const units = Math.ceil(batteryKwh / BATTERY_UNIT_KWH);
    batteryCost = units * BATTERY_UNIT_KWH * BATTERY_KWH_PRICE;
  }

  const annualKwh = Math.round(systemKw * psh * 365 * pr);
  const annualSavings = Math.round(annualKwh * input.utilityRate);
  const monthlySavings = Math.round(annualSavings / 12);

  const equipmentCost =
    numberOfPanels * PANEL_PRICE +
    inverterKw * INVERTER_PRICE_PER_KW +
    numberOfPanels * MOUNTING_PER_PANEL +
    batteryCost;
  const installationCost = Math.round(systemKw * INSTALLATION_PER_KW);
  const totalCost = Math.round(equipmentCost + installationCost);

  const paybackYears =
    annualSavings > 0 ? parseFloat((totalCost / annualSavings).toFixed(1)) : 0;

  let savings25 = 0;
  const deg = SOLAR_CONSTANTS.ANNUAL_DEGRADATION_RATE;
  for (let y = 0; y < SOLAR_CONSTANTS.SYSTEM_LIFESPAN_YEARS; y++) {
    savings25 += annualSavings * Math.pow(1 - deg, y);
  }
  const roi25Percent =
    totalCost > 0 ? parseFloat((((savings25 - totalCost) / totalCost) * 100).toFixed(1)) : 0;

  const co2KgPerYear = Math.round(annualKwh * SOLAR_CONSTANTS.CO2_KG_PER_KWH);

  return {
    systemKw,
    numberOfPanels,
    inverterKw,
    batteryKwh,
    annualKwh,
    monthlySavings,
    annualSavings,
    equipmentCost: Math.round(equipmentCost),
    installationCost,
    totalCost,
    paybackYears,
    roi25Percent,
    co2KgPerYear,
    roofLimited,
  };
}

export function calculateRoi(input: RoiInput): RoiResult {
  const years = input.lifespanYears ?? SOLAR_CONSTANTS.SYSTEM_LIFESPAN_YEARS;
  const deg = SOLAR_CONSTANTS.ANNUAL_DEGRADATION_RATE;
  const paybackYears =
    input.annualSavings > 0
      ? parseFloat((input.totalCost / input.annualSavings).toFixed(1))
      : 0;

  let totalSavings = 0;
  const yearlyBreakdown: RoiResult['yearlyBreakdown'] = [];
  for (let y = 1; y <= years; y++) {
    const yearSaving = input.annualSavings * Math.pow(1 - deg, y - 1);
    totalSavings += yearSaving;
    yearlyBreakdown.push({ year: y, cumulativeSavings: Math.round(totalSavings) });
  }

  const netProfit = Math.round(totalSavings - input.totalCost);
  const roiPercent =
    input.totalCost > 0
      ? parseFloat(((netProfit / input.totalCost) * 100).toFixed(1))
      : 0;

  return {
    paybackYears,
    totalSavings: Math.round(totalSavings),
    netProfit,
    roiPercent,
    yearlyBreakdown,
  };
}

export function calculateBatterySizing(input: BatterySizingInput): BatterySizingResult {
  const backupFactor = input.gridType === 'off_grid' ? 1.25 : 1.15;
  const requiredKwh = parseFloat(
    (input.dailyKwh * (input.autonomyHours / 24) * backupFactor).toFixed(1),
  );
  const units = Math.max(1, Math.ceil(requiredKwh / BATTERY_UNIT_KWH));
  const estimatedCost = Math.round(units * BATTERY_UNIT_KWH * BATTERY_KWH_PRICE);

  return { requiredKwh, units, estimatedCost };
}

export function calculateProduction(input: ProductionInput): ProductionResult {
  const psh = getPsh(input.provinceKey);
  const pr = SOLAR_CONSTANTS.PERFORMANCE_RATIO;
  const dailyKwh = parseFloat((input.systemKw * psh * pr).toFixed(1));
  const monthlyKwh = Math.round(dailyKwh * 30);
  const annualKwh = Math.round(dailyKwh * 365);
  const co2KgPerYear = Math.round(annualKwh * SOLAR_CONSTANTS.CO2_KG_PER_KWH);

  return {
    dailyKwh,
    monthlyKwh,
    annualKwh,
    co2KgPerYear,
    peakSunHours: psh,
  };
}
