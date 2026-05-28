"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ROUTES = exports.SOLAR_CONSTANTS = exports.SUBSCRIPTION_PLANS = exports.PASSWORD_MIN_LENGTH = exports.MFA_CODE_LENGTH = exports.JWT_REFRESH_EXPIRY = exports.JWT_ACCESS_EXPIRY = exports.APP_VERSION = exports.APP_NAME = void 0;
exports.APP_NAME = 'SolarTech';
exports.APP_VERSION = '0.1.0';
exports.JWT_ACCESS_EXPIRY = '15m';
exports.JWT_REFRESH_EXPIRY = '7d';
exports.MFA_CODE_LENGTH = 6;
exports.PASSWORD_MIN_LENGTH = 8;
exports.SUBSCRIPTION_PLANS = {
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
};
exports.SOLAR_CONSTANTS = {
    PANEL_EFFICIENCY_DEFAULT: 0.20,
    PERFORMANCE_RATIO: 0.78,
    CO2_KG_PER_KWH: 0.7,
    SYSTEM_LIFESPAN_YEARS: 25,
    ANNUAL_DEGRADATION_RATE: 0.005,
};
exports.API_ROUTES = {
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
};
//# sourceMappingURL=constants.js.map