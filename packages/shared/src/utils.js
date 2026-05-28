"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSystemSize = calculateSystemSize;
exports.calculateAnnualProduction = calculateAnnualProduction;
exports.calculatePaybackPeriod = calculatePaybackPeriod;
exports.calculateROI = calculateROI;
exports.calculateCO2Reduction = calculateCO2Reduction;
exports.slugify = slugify;
exports.formatCurrency = formatCurrency;
exports.formatKwh = formatKwh;
const constants_1 = require("./constants");
function calculateSystemSize(monthlyKwh, peakSunHours) {
    const dailyKwh = monthlyKwh / 30;
    return parseFloat((dailyKwh / (peakSunHours * constants_1.SOLAR_CONSTANTS.PERFORMANCE_RATIO)).toFixed(2));
}
function calculateAnnualProduction(systemKw, peakSunHours) {
    return parseFloat((systemKw * peakSunHours * 365 * constants_1.SOLAR_CONSTANTS.PERFORMANCE_RATIO).toFixed(0));
}
function calculatePaybackPeriod(totalCost, annualSavings) {
    if (annualSavings <= 0)
        return Infinity;
    return parseFloat((totalCost / annualSavings).toFixed(1));
}
function calculateROI(totalCost, annualSavings, years = constants_1.SOLAR_CONSTANTS.SYSTEM_LIFESPAN_YEARS) {
    let totalSavings = 0;
    for (let i = 0; i < years; i++) {
        totalSavings += annualSavings * Math.pow(1 - constants_1.SOLAR_CONSTANTS.ANNUAL_DEGRADATION_RATE, i);
    }
    return parseFloat((((totalSavings - totalCost) / totalCost) * 100).toFixed(1));
}
function calculateCO2Reduction(annualKwh) {
    return parseFloat((annualKwh * constants_1.SOLAR_CONSTANTS.CO2_KG_PER_KWH).toFixed(0));
}
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .trim();
}
function formatCurrency(amount, currency = 'PHP') {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}
function formatKwh(kwh) {
    if (kwh >= 1000)
        return `${(kwh / 1000).toFixed(1)} MWh`;
    return `${kwh.toFixed(1)} kWh`;
}
//# sourceMappingURL=utils.js.map