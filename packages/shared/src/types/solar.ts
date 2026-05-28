export interface SolarQuotation {
  id: string;
  clientId: string;
  organizationId: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'expired';
  input: QuotationInput;
  output: QuotationOutput;
  proposalUrl?: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationInput {
  monthlyBill: number;
  monthlyKwh: number;
  roofArea: number;
  roofLength?: number;
  roofWidth?: number;
  roofType: 'flat' | 'pitched' | 'metal' | 'concrete';
  roofAzimuth?: number;
  latitude: number;
  longitude: number;
  peakSunHours?: number;
  province?: string;
  provinceKey?: string;
  gridType: 'on_grid' | 'off_grid' | 'hybrid';
  includesBattery: boolean;
  currency: string;
  utilityRate: number;
  address?: string;
  city?: string;
}

export interface QuotationOutput {
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
  equipment: EquipmentRecommendation[];
  analytics?: QuotationAnalytics;
  proposalSummary?: QuotationProposalSummary;
}

export interface QuotationAnalytics {
  peakSunHoursUsed: number;
  provinceKey?: string;
  roofLimited?: boolean;
  energyOffsetPercent: number;
  energyOffsetMonthly: Array<{
    month: string;
    consumption: number;
    solar: number;
    offsetPercent: number;
  }>;
  financialForecast: Array<{
    year: number;
    annualSavings: number;
    cumulativeSavings: number;
    netPosition: number;
  }>;
  monthlyProduction: Array<{ month: string; kwh: number }>;
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
}

export interface QuotationProposalSummary {
  headline: string;
  location: string;
  systemOverview: string;
  financialHighlights: string[];
  productionNote: string;
  validForDays: number;
}

export interface EquipmentRecommendation {
  type: 'panel' | 'inverter' | 'battery' | 'mounting' | 'wiring';
  brand: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specs: Record<string, string | number>;
}

export interface SolarSystem {
  id: string;
  clientId: string;
  organizationId: string;
  quotationId?: string;
  name: string;
  status: 'planning' | 'installing' | 'active' | 'maintenance' | 'offline';
  systemSizeKw: number;
  installedAt?: string;
  location: {
    address: string;
    city: string;
    province: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  devices: string[];
  createdAt: string;
  updatedAt: string;
}
