"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTT_TOPICS = void 0;
exports.MQTT_TOPICS = {
    telemetry: (orgId, systemId, deviceId) => `solartech/${orgId}/${systemId}/${deviceId}/telemetry`,
    alert: (orgId, systemId, deviceId) => `solartech/${orgId}/${systemId}/${deviceId}/alert`,
    command: (orgId, systemId, deviceId) => `solartech/${orgId}/${systemId}/${deviceId}/command`,
    status: (orgId, systemId, deviceId) => `solartech/${orgId}/${systemId}/${deviceId}/status`,
    firmware: (orgId, deviceId) => `solartech/${orgId}/firmware/${deviceId}`,
};
//# sourceMappingURL=device.js.map