export declare const APP_NAME = "SolarTech";
export declare const APP_VERSION = "0.1.0";
export declare const JWT_ACCESS_EXPIRY = "15m";
export declare const JWT_REFRESH_EXPIRY = "7d";
export declare const MFA_CODE_LENGTH = 6;
export declare const PASSWORD_MIN_LENGTH = 8;
export declare const SUBSCRIPTION_PLANS: {
    readonly starter: {
        readonly name: "Starter";
        readonly maxUsers: 5;
        readonly maxSystems: 10;
        readonly maxDevices: 50;
        readonly price: 49;
    };
    readonly professional: {
        readonly name: "Professional";
        readonly maxUsers: 25;
        readonly maxSystems: 100;
        readonly maxDevices: 500;
        readonly price: 149;
    };
    readonly enterprise: {
        readonly name: "Enterprise";
        readonly maxUsers: number;
        readonly maxSystems: number;
        readonly maxDevices: number;
        readonly price: 499;
    };
};
export declare const SOLAR_CONSTANTS: {
    readonly PANEL_EFFICIENCY_DEFAULT: 0.2;
    readonly PERFORMANCE_RATIO: 0.78;
    readonly CO2_KG_PER_KWH: 0.7;
    readonly SYSTEM_LIFESPAN_YEARS: 25;
    readonly ANNUAL_DEGRADATION_RATE: 0.005;
};
export declare const API_ROUTES: {
    readonly AUTH: "/api/v1/auth";
    readonly USERS: "/api/v1/users";
    readonly ORGANIZATIONS: "/api/v1/organizations";
    readonly QUOTATIONS: "/api/v1/quotations";
    readonly SYSTEMS: "/api/v1/solar-systems";
    readonly DEVICES: "/api/v1/devices";
    readonly TELEMETRY: "/api/v1/telemetry";
    readonly INSTALLERS: "/api/v1/installers";
    readonly MAINTENANCE: "/api/v1/maintenance";
    readonly BILLING: "/api/v1/billing";
    readonly ANALYTICS: "/api/v1/analytics";
    readonly SMART_CITY: "/api/v1/smart-city";
    readonly NOTIFICATIONS: "/api/v1/notifications";
    readonly AI: "/api/v1/ai";
};
