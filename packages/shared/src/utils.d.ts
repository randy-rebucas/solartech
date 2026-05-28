export declare function calculateSystemSize(monthlyKwh: number, peakSunHours: number): number;
export declare function calculateAnnualProduction(systemKw: number, peakSunHours: number): number;
export declare function calculatePaybackPeriod(totalCost: number, annualSavings: number): number;
export declare function calculateROI(totalCost: number, annualSavings: number, years?: 25): number;
export declare function calculateCO2Reduction(annualKwh: number): number;
export declare function slugify(text: string): string;
export declare function formatCurrency(amount: number, currency?: string): string;
export declare function formatKwh(kwh: number): string;
