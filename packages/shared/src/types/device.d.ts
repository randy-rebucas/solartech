export type DeviceType = 'inverter' | 'battery' | 'smart_meter' | 'weather_sensor' | 'ev_charger' | 'esp32' | 'raspberry_pi';
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'error' | 'maintenance';
export interface Device {
    id: string;
    solarSystemId: string;
    organizationId: string;
    name: string;
    type: DeviceType;
    status: DeviceStatus;
    serialNumber: string;
    firmware: string;
    macAddress?: string;
    ipAddress?: string;
    mqttClientId: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    metadata: Record<string, string | number | boolean>;
    lastSeenAt?: string;
    registeredAt: string;
    updatedAt: string;
}
export interface Telemetry {
    deviceId: string;
    timestamp: string;
    metrics: TelemetryMetrics;
}
export interface TelemetryMetrics {
    powerOutputW?: number;
    voltageV?: number;
    currentA?: number;
    frequencyHz?: number;
    temperatureCelsius?: number;
    batteryLevelPercent?: number;
    batteryStateOfCharge?: number;
    energyTodayKwh?: number;
    energyTotalKwh?: number;
    gridPowerW?: number;
    loadPowerW?: number;
    irradianceWm2?: number;
    windSpeedMs?: number;
    [key: string]: number | undefined;
}
export interface DeviceAlert {
    id: string;
    deviceId: string;
    type: 'fault' | 'warning' | 'info';
    code: string;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    resolvedAt?: string;
    createdAt: string;
}
export declare const MQTT_TOPICS: {
    readonly telemetry: (orgId: string, systemId: string, deviceId: string) => string;
    readonly alert: (orgId: string, systemId: string, deviceId: string) => string;
    readonly command: (orgId: string, systemId: string, deviceId: string) => string;
    readonly status: (orgId: string, systemId: string, deviceId: string) => string;
    readonly firmware: (orgId: string, deviceId: string) => string;
};
