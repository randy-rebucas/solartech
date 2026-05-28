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
    roofType: 'flat' | 'pitched' | 'metal' | 'concrete';
    roofAzimuth?: number;
    latitude: number;
    longitude: number;
    peakSunHours?: number;
    gridType: 'on_grid' | 'off_grid' | 'hybrid';
    includesBattery: boolean;
    currency: string;
    utilityRate: number;
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
