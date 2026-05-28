/** Analytics shapes returned by POST /quotations/estimate (and stored on quotation.output). */

export type EnergyOffsetMonth = {
  month: string;
  consumption: number;
  solar: number;
  offsetPercent: number;
};

export type FinancialForecastYear = {
  year: number;
  annualSavings: number;
  cumulativeSavings: number;
  netPosition: number;
};

export type MonthlyProduction = { month: string; kwh: number };

export type QuotationAnalytics = {
  peakSunHoursUsed: number;
  provinceKey?: string;
  roofLimited?: boolean;
  energyOffsetPercent: number;
  energyOffsetMonthly: EnergyOffsetMonth[];
  financialForecast: FinancialForecastYear[];
  monthlyProduction: MonthlyProduction[];
  netMetering: {
    eligible: boolean;
    estimatedExportKwhPerYear: number;
    estimatedBillReductionPercent: number;
    estimatedAnnualCreditPhp: number;
    notes: string;
  };
  inverterRecommendation: {
    brand: string;
    model: string;
    sizeKw: number;
    rationale: string;
  };
  batteryRecommendation?: {
    capacityKwh: number;
    units: number;
    brand: string;
    model: string;
    estimatedCost: number;
  };
  roofEstimate?: {
    areaSqm: number;
    maxPanels: number;
    panelsUsed: number;
    utilizationPercent: number;
  };
};

export type QuotationCalcOutput = {
  recommendedSystemSizeKw: number;
  numberOfPanels: number;
  panelWattage: number;
  inverterSizeKw: number;
  batteryCapacityKwh?: number;
  estimatedAnnualProductionKwh: number;
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  systemCost: number;
  installationCost: number;
  totalCost: number;
  paybackPeriodYears: number;
  roi25Years: number;
  co2ReductionKgPerYear: number;
  netMeteringEligible: boolean;
  equipment?: Array<{
    type: string;
    brand: string;
    model: string;
    quantity: number;
    totalPrice: number;
  }>;
  analytics?: QuotationAnalytics;
  proposalSummary?: {
    headline: string;
    location: string;
    systemOverview: string;
    financialHighlights: string[];
    productionNote: string;
    validForDays: number;
  };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASON = [0.95, 0.98, 1.02, 1.05, 0.92, 0.88, 0.85, 0.9, 0.95, 1.0, 1.02, 1.0];

/** Build chart data for older quotations saved before analytics existed. */
export function ensureAnalytics(
  output: QuotationCalcOutput,
  monthlyKwh = 0,
): QuotationAnalytics {
  if (output.analytics) return output.analytics;

  const offset =
    monthlyKwh > 0
      ? Math.min(100, Math.round((output.estimatedAnnualProductionKwh / 12 / monthlyKwh) * 100))
      : 0;
  const avgSolar = output.estimatedAnnualProductionKwh / 12;

  let cumulative = 0;
  const financialForecast: FinancialForecastYear[] = [];
  for (let y = 0; y < 25; y++) {
    const annual = Math.round(output.estimatedAnnualSavings * Math.pow(0.995, y));
    cumulative += annual;
    financialForecast.push({
      year: y + 1,
      annualSavings: annual,
      cumulativeSavings: cumulative,
      netPosition: cumulative - output.totalCost,
    });
  }

  return {
    peakSunHoursUsed: 4.5,
    energyOffsetPercent: offset,
    energyOffsetMonthly: MONTHS.map((month, i) => {
      const solar = Math.round(avgSolar * SEASON[i]);
      return {
        month,
        consumption: monthlyKwh,
        solar,
        offsetPercent: monthlyKwh > 0 ? Math.min(100, Math.round((solar / monthlyKwh) * 100)) : 0,
      };
    }),
    financialForecast,
    monthlyProduction: MONTHS.map((month, i) => ({
      month,
      kwh: Math.round(avgSolar * SEASON[i]),
    })),
    netMetering: {
      eligible: output.netMeteringEligible,
      estimatedExportKwhPerYear: Math.max(0, output.estimatedAnnualProductionKwh - monthlyKwh * 12),
      estimatedBillReductionPercent: offset,
      estimatedAnnualCreditPhp: 0,
      notes: output.netMeteringEligible
        ? 'Net metering eligibility based on grid connection type.'
        : 'Off-grid configuration.',
    },
    inverterRecommendation: {
      brand: 'Growatt',
      model: `MIN-${output.inverterSizeKw}K`,
      sizeKw: output.inverterSizeKw,
      rationale: 'Sized at 110% of DC capacity for Philippine grid standards.',
    },
  };
}

export function financialChartData(analytics: QuotationAnalytics) {
  return analytics.financialForecast.map((y) => ({
    year: y.year,
    cumulative: y.cumulativeSavings,
    annual: y.annualSavings,
    net: y.netPosition,
    cost: 0,
  }));
}
