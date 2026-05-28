import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface CalcInput {
  monthlyBill: number;
  monthlyKwh: number;
  roofArea: number;
  roofLength?: number;
  roofWidth?: number;
  roofType: string;
  roofAzimuth?: number;
  latitude: number;
  longitude: number;
  peakSunHours?: number;
  province?: string;
  provinceKey?: string;
  gridType: string;
  includesBattery: boolean;
  currency: string;
  utilityRate: number;
  address?: string;
  city?: string;
}

export const PROVINCE_PSH: Record<string, number> = {
  default: 4.5,
  metro_manila: 4.5,
  cebu: 4.8,
  davao: 5.1,
  iloilo: 4.9,
  laguna: 4.4,
  batangas: 4.6,
  pampanga: 4.7,
  cagayan: 5.0,
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Seasonal factor vs annual average (Philippines — wet season dip mid-year). */
const MONTHLY_SEASON_FACTORS = [0.95, 0.98, 1.02, 1.05, 0.92, 0.88, 0.85, 0.9, 0.95, 1.0, 1.02, 1.0];

const PANEL_CONFIGS = [
  { wattage: 550, brand: 'JA Solar', model: 'JAM72S30-550/MR', pricePerPanel: 8500 },
  { wattage: 500, brand: 'Longi Solar', model: 'LR4-72HBD-500M', pricePerPanel: 7800 },
];

const INVERTER_CONFIGS = [
  { brand: 'Growatt', series: 'MIN', maxKw: 6, pricePerKw: 4500, efficiency: '98.2%' },
  { brand: 'Growatt', series: 'MID', maxKw: 15, pricePerKw: 5200, efficiency: '98.4%' },
  { brand: 'SolarEdge', series: 'SE', maxKw: 25, pricePerKw: 7000, efficiency: '99%' },
  { brand: 'Fronius', series: 'Symo', maxKw: 50, pricePerKw: 6500, efficiency: '98.1%' },
];

const BATTERY_CONFIGS = [
  { brand: 'Pylontech', model: 'US5000', capacityKwh: 4.8, pricePerKwh: 18000 },
];

const PERFORMANCE_RATIO = 0.78;
const CO2_PER_KWH = 0.7;
const INSTALLATION_COST_PER_KW = 15000;
const DEGRADATION = 0.005;
const PANEL_AREA_SQM = 2.1;

type EquipmentItem = {
  type: string;
  brand: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specs: Record<string, string | number>;
};

export function resolveProvinceKey(province?: string, provinceKey?: string): string {
  if (provinceKey && PROVINCE_PSH[provinceKey]) return provinceKey;
  if (!province) return 'default';
  const norm = province.toLowerCase().replace(/[^a-z]/g, '_');
  if (PROVINCE_PSH[norm]) return norm;
  if (norm.includes('manila') || norm.includes('ncr') || norm.includes('metro')) return 'metro_manila';
  if (norm.includes('cebu')) return 'cebu';
  if (norm.includes('davao')) return 'davao';
  if (norm.includes('iloilo')) return 'iloilo';
  if (norm.includes('laguna')) return 'laguna';
  if (norm.includes('batangas')) return 'batangas';
  if (norm.includes('pampanga')) return 'pampanga';
  if (norm.includes('cagayan')) return 'cagayan';
  return 'default';
}

export function resolvePsh(input: Pick<CalcInput, 'peakSunHours' | 'province' | 'provinceKey'>): number {
  if (input.peakSunHours != null && input.peakSunHours > 0) return input.peakSunHours;
  const key = resolveProvinceKey(input.province, input.provinceKey);
  return PROVINCE_PSH[key] ?? PROVINCE_PSH.default;
}

function pickInverter(systemKw: number) {
  const sized = INVERTER_CONFIGS.find((inv) => systemKw <= inv.maxKw);
  return sized ?? INVERTER_CONFIGS[INVERTER_CONFIGS.length - 1];
}

function effectiveRoofArea(input: CalcInput): number {
  if (input.roofLength && input.roofWidth && input.roofLength > 0 && input.roofWidth > 0) {
    return Math.round(input.roofLength * input.roofWidth * 10) / 10;
  }
  return input.roofArea;
}

@Injectable()
export class SolarCalculatorService {
  private openai?: OpenAI;

  constructor(private config: ConfigService) {
    const key = config.get<string>('app.openai.apiKey');
    if (key) this.openai = new OpenAI({ apiKey: key });
  }

  calculate(input: CalcInput) {
    const psh = resolvePsh(input);
    const roofArea = effectiveRoofArea(input);
    const dailyKwh = input.monthlyKwh / 30;
    const targetKw = dailyKwh / (psh * PERFORMANCE_RATIO);

    const panel = PANEL_CONFIGS[0];
    const maxPanelsByRoof = Math.floor(roofArea / PANEL_AREA_SQM);
    const panelsNeeded = Math.ceil((targetKw * 1000) / panel.wattage);
    const numberOfPanels = Math.min(panelsNeeded, maxPanelsByRoof);
    const roofLimited = panelsNeeded > maxPanelsByRoof;
    const actualSystemKw = parseFloat(((numberOfPanels * panel.wattage) / 1000).toFixed(2));

    const inverterPick = pickInverter(actualSystemKw);
    const inverterKw = parseFloat((actualSystemKw * 1.1).toFixed(1));

    let batteryCapacityKwh: number | undefined;
    let batteryCost = 0;
    let batteryUnits = 0;
    if (input.includesBattery || input.gridType !== 'on_grid') {
      const bat = BATTERY_CONFIGS[0];
      const autonomyHours = input.gridType === 'off_grid' ? 8 : 4;
      batteryCapacityKwh = parseFloat((dailyKwh * (autonomyHours / 24) * 1.2).toFixed(1));
      batteryUnits = Math.ceil(batteryCapacityKwh / bat.capacityKwh);
      batteryCost = batteryUnits * bat.capacityKwh * bat.pricePerKwh;
    }

    const annualKwh = Math.round(actualSystemKw * psh * 365 * PERFORMANCE_RATIO);
    const annualSavings = parseFloat((annualKwh * input.utilityRate).toFixed(0));
    const monthlySavings = parseFloat((annualSavings / 12).toFixed(0));

    const systemCost =
      numberOfPanels * panel.pricePerPanel + inverterKw * inverterPick.pricePerKw + batteryCost;
    const installationCost = Math.round(actualSystemKw * INSTALLATION_COST_PER_KW);
    const totalCost = Math.round(systemCost + installationCost);

    const payback =
      annualSavings > 0 ? parseFloat((totalCost / annualSavings).toFixed(1)) : 0;

    let savings25 = 0;
    const financialForecast: Array<{
      year: number;
      annualSavings: number;
      cumulativeSavings: number;
      netPosition: number;
    }> = [];

    for (let y = 0; y < 25; y++) {
      const yearSaving = Math.round(annualSavings * Math.pow(1 - DEGRADATION, y));
      savings25 += yearSaving;
      financialForecast.push({
        year: y + 1,
        annualSavings: yearSaving,
        cumulativeSavings: Math.round(savings25),
        netPosition: Math.round(savings25 - totalCost),
      });
    }
    const roi =
      totalCost > 0 ? parseFloat((((savings25 - totalCost) / totalCost) * 100).toFixed(1)) : 0;

    const co2 = Math.round(annualKwh * CO2_PER_KWH);
    const energyOffsetPercent =
      input.monthlyKwh > 0
        ? Math.min(100, Math.round((annualKwh / 12 / input.monthlyKwh) * 100))
        : 0;

    const avgMonthlySolar = annualKwh / 12;
    const energyOffsetMonthly = MONTH_LABELS.map((month, i) => {
      const solar = Math.round(avgMonthlySolar * MONTHLY_SEASON_FACTORS[i]);
      const consumption = input.monthlyKwh;
      return {
        month,
        consumption,
        solar,
        offsetPercent: consumption > 0 ? Math.min(100, Math.round((solar / consumption) * 100)) : 0,
      };
    });

    const monthlyProduction = MONTH_LABELS.map((month, i) => ({
      month,
      kwh: Math.round(avgMonthlySolar * MONTHLY_SEASON_FACTORS[i]),
    }));

    const exportKwh = Math.max(0, annualKwh - input.monthlyKwh * 12);
    const netMeteringEligible = input.gridType === 'on_grid' || input.gridType === 'hybrid';
    const billReductionPercent = netMeteringEligible
      ? Math.min(95, energyOffsetPercent)
      : Math.min(100, energyOffsetPercent);
    const netMeteringCredit = Math.round(exportKwh * input.utilityRate * 0.65);

    const equipment: EquipmentItem[] = [
      {
        type: 'panel',
        brand: panel.brand,
        model: panel.model,
        quantity: numberOfPanels,
        unitPrice: panel.pricePerPanel,
        totalPrice: numberOfPanels * panel.pricePerPanel,
        specs: { wattage: panel.wattage, efficiency: '21%', warranty: '25 years' },
      },
      {
        type: 'inverter',
        brand: inverterPick.brand,
        model: `${inverterPick.series}-${inverterKw}K`,
        quantity: 1,
        unitPrice: inverterKw * inverterPick.pricePerKw,
        totalPrice: inverterKw * inverterPick.pricePerKw,
        specs: { sizeKw: inverterKw, efficiency: inverterPick.efficiency, warranty: '5 years' },
      },
    ];

    if (batteryCapacityKwh && batteryUnits > 0) {
      const bat = BATTERY_CONFIGS[0];
      equipment.push({
        type: 'battery',
        brand: bat.brand,
        model: bat.model,
        quantity: batteryUnits,
        unitPrice: bat.capacityKwh * bat.pricePerKwh,
        totalPrice: batteryCost,
        specs: { capacityKwh: bat.capacityKwh, chemistry: 'LFP', warranty: '10 years' },
      });
    }

    equipment.push({
      type: 'mounting',
      brand: 'Schletter',
      model: 'FlatFix Fusion',
      quantity: numberOfPanels,
      unitPrice: 800,
      totalPrice: numberOfPanels * 800,
      specs: { material: 'Aluminum', windLoad: '200 km/h' },
    });

    const inverterRationale =
      actualSystemKw <= 6
        ? 'String inverter sized for residential rooftop; optimized for Philippine grid voltage.'
        : actualSystemKw <= 15
          ? 'Mid-range inverter with headroom for peak production and future expansion.'
          : 'Commercial-grade inverter for larger arrays and three-phase connections.';

    return {
      recommendedSystemSizeKw: actualSystemKw,
      numberOfPanels,
      panelWattage: panel.wattage,
      inverterSizeKw: inverterKw,
      batteryCapacityKwh,
      estimatedAnnualProductionKwh: annualKwh,
      estimatedMonthlySavings: monthlySavings,
      estimatedAnnualSavings: annualSavings,
      systemCost: Math.round(systemCost),
      installationCost,
      totalCost,
      paybackPeriodYears: payback,
      roi25Years: roi,
      co2ReductionKgPerYear: co2,
      netMeteringEligible,
      equipment,
      analytics: {
        peakSunHoursUsed: psh,
        provinceKey: resolveProvinceKey(input.province, input.provinceKey),
        roofLimited,
        energyOffsetPercent,
        energyOffsetMonthly,
        financialForecast,
        monthlyProduction,
        netMetering: {
          eligible: netMeteringEligible,
          estimatedExportKwhPerYear: exportKwh,
          estimatedBillReductionPercent: billReductionPercent,
          estimatedAnnualCreditPhp: netMeteringCredit,
          notes: netMeteringEligible
            ? 'Eligible under Philippine net metering (DU-dependent). Export credits typically offset nighttime consumption.'
            : 'Off-grid systems do not qualify for net metering; battery storage recommended for night loads.',
        },
        inverterRecommendation: {
          brand: inverterPick.brand,
          model: `${inverterPick.series}-${inverterKw}K`,
          sizeKw: inverterKw,
          rationale: inverterRationale,
        },
        batteryRecommendation: batteryCapacityKwh
          ? {
              capacityKwh: batteryCapacityKwh,
              units: batteryUnits,
              brand: BATTERY_CONFIGS[0].brand,
              model: BATTERY_CONFIGS[0].model,
              estimatedCost: batteryCost,
            }
          : undefined,
        roofEstimate: {
          areaSqm: roofArea,
          maxPanels: maxPanelsByRoof,
          panelsUsed: numberOfPanels,
          utilizationPercent:
            maxPanelsByRoof > 0 ? Math.round((numberOfPanels / maxPanelsByRoof) * 100) : 0,
        },
      },
      proposalSummary: this.buildProposalSummary(input, {
        actualSystemKw,
        annualKwh,
        annualSavings,
        totalCost,
        payback,
        roi,
        numberOfPanels,
        panel,
        inverterPick,
        inverterKw,
        energyOffsetPercent,
        psh,
      }),
    };
  }

  private buildProposalSummary(
    input: CalcInput,
    ctx: {
      actualSystemKw: number;
      annualKwh: number;
      annualSavings: number;
      totalCost: number;
      payback: number;
      roi: number;
      numberOfPanels: number;
      panel: (typeof PANEL_CONFIGS)[0];
      inverterPick: (typeof INVERTER_CONFIGS)[0];
      inverterKw: number;
      energyOffsetPercent: number;
      psh: number;
    },
  ) {
    return {
      headline: `${ctx.actualSystemKw} kW Solar System Proposal`,
      location: [input.address, input.city, input.province].filter((s) => s && String(s).trim()).join(', ') || 'Philippines',
      systemOverview: `${ctx.numberOfPanels} × ${ctx.panel.wattage}W ${ctx.panel.brand} panels with ${ctx.inverterPick.brand} ${ctx.inverterPick.series}-${ctx.inverterKw}K inverter.`,
      financialHighlights: [
        `Total investment: ₱${ctx.totalCost.toLocaleString()}`,
        `Estimated annual savings: ₱${ctx.annualSavings.toLocaleString()}`,
        `Simple payback: ${ctx.payback} years`,
        `25-year ROI: ${ctx.roi}%`,
      ],
      productionNote: `Estimated ${ctx.annualKwh.toLocaleString()} kWh/year at ${ctx.psh} peak sun hours (${ctx.energyOffsetPercent}% energy offset).`,
      validForDays: 30,
    };
  }

  async generateAiInsights(
    input: CalcInput,
    output: ReturnType<SolarCalculatorService['calculate']>,
  ): Promise<string> {
    const fallback = `Recommended ${output.recommendedSystemSizeKw} kW system producing ~${output.estimatedAnnualProductionKwh.toLocaleString()} kWh/year. Estimated savings ₱${output.estimatedAnnualSavings.toLocaleString()}/year with ${output.paybackPeriodYears}-year payback and ${output.roi25Years}% ROI over 25 years. ${output.analytics.inverterRecommendation.brand} ${output.analytics.inverterRecommendation.model} inverter selected. Energy offset: ${output.analytics.energyOffsetPercent}%.`;

    if (!this.openai) return fallback;

    const prompt = `You are a solar energy consultant in the Philippines. Write a professional 3-paragraph proposal narrative (plain text, no markdown) covering: (1) system sizing and production, (2) financial benefits and net metering, (3) equipment and installation advice.

Site: ${output.proposalSummary.location}
System: ${output.proposalSummary.systemOverview}
Financials: ${output.proposalSummary.financialHighlights.join('; ')}
Net metering: ${JSON.stringify(output.analytics.netMetering)}
Inverter: ${output.analytics.inverterRecommendation.rationale}`;

    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 450,
      temperature: 0.7,
    });

    return res.choices[0].message.content ?? fallback;
  }

  buildProposalDocument(
    input: CalcInput,
    output: ReturnType<SolarCalculatorService['calculate']>,
    notes?: string,
  ) {
    return {
      generatedAt: new Date().toISOString(),
      summary: output.proposalSummary,
      input: {
        monthlyBill: input.monthlyBill,
        monthlyKwh: input.monthlyKwh,
        utilityRate: input.utilityRate,
        roofArea: effectiveRoofArea(input),
        gridType: input.gridType,
        includesBattery: input.includesBattery,
      },
      output: {
        systemKw: output.recommendedSystemSizeKw,
        totalCost: output.totalCost,
        paybackYears: output.paybackPeriodYears,
        roi25: output.roi25Years,
        annualProductionKwh: output.estimatedAnnualProductionKwh,
        annualSavings: output.estimatedAnnualSavings,
      },
      equipment: output.equipment,
      analytics: output.analytics,
      narrative: notes ?? '',
    };
  }
}
