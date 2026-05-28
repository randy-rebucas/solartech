/** Static demo dataset for `npm run db:seed` */

export const DEMO_PASSWORD = 'Demo1234!';

export const ORGANIZATIONS = [
  {
    key: 'ecosolar',
    name: 'EcoSolar Philippines',
    slug: 'ecosolar-ph',
    plan: 'professional' as const,
    city: 'Makati',
    province: 'Metro Manila',
    website: 'https://ecosolar.ph',
    phone: '+63 2 8123 4567',
  },
  {
    key: 'sunworks',
    name: 'SunWorks Installers',
    slug: 'sunworks-installers',
    plan: 'starter' as const,
    city: 'Cebu City',
    province: 'Cebu',
    website: 'https://sunworks.ph',
    phone: '+63 32 255 0100',
  },
];

export const USERS = [
  { key: 'admin', email: 'admin@solartech.ph', firstName: 'Alex', lastName: 'Reyes', role: 'super_admin', org: null },
  { key: 'maria', email: 'maria@ecosolar.ph', firstName: 'Maria', lastName: 'Santos', role: 'solar_company', org: 'ecosolar' },
  { key: 'carlo', email: 'carlo@ecosolar.ph', firstName: 'Carlo', lastName: 'Mendoza', role: 'installer', org: 'ecosolar' },
  { key: 'tech', email: 'tech@ecosolar.ph', firstName: 'Rico', lastName: 'Dela Cruz', role: 'technician', org: 'ecosolar' },
  { key: 'finance', email: 'finance@ecosolar.ph', firstName: 'Ana', lastName: 'Lim', role: 'finance_officer', org: 'ecosolar' },
  { key: 'client', email: 'client@demo.ph', firstName: 'Juan', lastName: 'Dela Cruz', role: 'client', org: 'ecosolar' },
  { key: 'lgu', email: 'lgu@manila.gov.ph', firstName: 'Pedro', lastName: 'Reyes', role: 'lgu_officer', org: null },
  { key: 'jenny', email: 'jenny@sunworks.ph', firstName: 'Jenny', lastName: 'Go', role: 'installer', org: 'sunworks' },
  { key: 'investor', email: 'investor@ecosolar.ph', firstName: 'Lisa', lastName: 'Tan', role: 'investor', org: 'ecosolar' },
];

export const SOLAR_SITES = [
  { name: 'Makati Corporate HQ', city: 'Makati', province: 'Metro Manila', lat: 14.5547, lng: 121.0244, kw: 45, org: 'ecosolar' },
  { name: 'QC Family Home', city: 'Quezon City', province: 'Metro Manila', lat: 14.676, lng: 121.0437, kw: 8.25, org: 'ecosolar', client: 'client' },
  { name: 'BGC Tower Rooftop', city: 'Taguig', province: 'Metro Manila', lat: 14.5515, lng: 121.047, kw: 120, org: 'ecosolar' },
  { name: 'Laguna Warehouse', city: 'Santa Rosa', province: 'Laguna', lat: 14.3124, lng: 121.1114, kw: 62, org: 'ecosolar' },
  { name: 'Batangas Resort', city: 'Lipa', province: 'Batangas', lat: 13.9411, lng: 121.1631, kw: 25.5, org: 'ecosolar' },
  { name: 'Cebu IT Park', city: 'Cebu City', province: 'Cebu', lat: 10.3157, lng: 123.8854, kw: 88, org: 'ecosolar' },
  { name: 'Mandaue Factory', city: 'Mandaue', province: 'Cebu', lat: 10.3236, lng: 123.922, kw: 35, org: 'ecosolar' },
  { name: 'Davao Mall Annex', city: 'Davao City', province: 'Davao', lat: 7.0731, lng: 125.6128, kw: 55, org: 'ecosolar' },
  { name: 'Iloilo Clinic', city: 'Iloilo City', province: 'Iloilo', lat: 10.7202, lng: 122.5621, kw: 12.4, org: 'ecosolar' },
  { name: 'Pampanga Cold Storage', city: 'Angeles', province: 'Pampanga', lat: 15.145, lng: 120.5847, kw: 78, org: 'ecosolar' },
  { name: 'Cagayan Office', city: 'Cagayan de Oro', province: 'Misamis Oriental', lat: 8.4542, lng: 124.6319, kw: 18, org: 'ecosolar' },
  { name: 'Cebu Residential', city: 'Cebu City', province: 'Cebu', lat: 10.2926, lng: 123.9022, kw: 6.6, org: 'sunworks', client: 'client' },
];

export const SAMPLE_QUOTATION_OUTPUT = {
  recommendedSystemSizeKw: 8.25,
  numberOfPanels: 15,
  panelWattage: 550,
  inverterSizeKw: 9.1,
  batteryCapacityKwh: undefined as number | undefined,
  estimatedAnnualProductionKwh: 12800,
  estimatedMonthlySavings: 11200,
  estimatedAnnualSavings: 134400,
  systemCost: 185000,
  installationCost: 123750,
  totalCost: 308750,
  paybackPeriodYears: 2.3,
  roi25Years: 985,
  co2ReductionKgPerYear: 8960,
  netMeteringEligible: true,
  equipment: [
    { type: 'panel', brand: 'JA Solar', model: 'JAM72S30-550', quantity: 15, unitPrice: 8500, totalPrice: 127500, specs: { wattage: 550 } },
    { type: 'inverter', brand: 'Growatt', model: 'MIN-9000TL-X', quantity: 1, unitPrice: 40950, totalPrice: 40950, specs: { sizeKw: 9.1 } },
  ],
};
