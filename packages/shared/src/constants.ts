export const APP_NAME = 'SolarTech';
export const APP_VERSION = '0.1.0';

export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';
export const MFA_CODE_LENGTH = 6;
export const PASSWORD_MIN_LENGTH = 8;

export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    maxUsers: 5,
    maxSystems: 10,
    maxDevices: 50,
    price: 49,
  },
  professional: {
    name: 'Professional',
    maxUsers: 25,
    maxSystems: 100,
    maxDevices: 500,
    price: 149,
  },
  enterprise: {
    name: 'Enterprise',
    maxUsers: Infinity,
    maxSystems: Infinity,
    maxDevices: Infinity,
    price: 499,
  },
} as const;

export const SOLAR_CONSTANTS = {
  PANEL_EFFICIENCY_DEFAULT: 0.20,
  PERFORMANCE_RATIO: 0.78,
  CO2_KG_PER_KWH: 0.7,
  SYSTEM_LIFESPAN_YEARS: 25,
  ANNUAL_DEGRADATION_RATE: 0.005,
} as const;

export const API_ROUTES = {
  AUTH: '/api/v1/auth',
  USERS: '/api/v1/users',
  ORGANIZATIONS: '/api/v1/organizations',
  QUOTATIONS: '/api/v1/quotations',
  SYSTEMS: '/api/v1/solar-systems',
  DEVICES: '/api/v1/devices',
  TELEMETRY: '/api/v1/telemetry',
  INSTALLERS: '/api/v1/installers',
  MAINTENANCE: '/api/v1/maintenance',
  BILLING: '/api/v1/billing',
  ANALYTICS: '/api/v1/analytics',
  SMART_CITY: '/api/v1/smart-city',
  NOTIFICATIONS: '/api/v1/notifications',
  AI: '/api/v1/ai',
} as const;
