import { MQTT_TOPICS, type DeviceType } from '@solartech/shared';

export { MQTT_TOPICS };

export function resolveMqttSystemId(solarSystemId?: string | { _id: string }): string {
  if (!solarSystemId) return 'default';
  if (typeof solarSystemId === 'string') return solarSystemId;
  return solarSystemId._id;
}

/** Example telemetry metrics keyed by device type (for onboarding copy-paste). */
export function sampleTelemetryPayload(type: string): Record<string, unknown> {
  const ts = new Date().toISOString();
  const base = { timestamp: ts, metrics: {} as Record<string, number> };

  switch (type as DeviceType) {
    case 'inverter':
      base.metrics = { powerOutputW: 4200, voltageV: 230, energyTodayKwh: 18.4, frequencyHz: 50 };
      break;
    case 'battery':
      base.metrics = { batteryLevelPercent: 78, batteryStateOfCharge: 0.78, powerOutputW: -1200 };
      break;
    case 'smart_meter':
      base.metrics = { gridPowerW: 850, loadPowerW: 2100, energyTodayKwh: 12.1 };
      break;
    case 'weather_sensor':
      base.metrics = { irradianceWm2: 780, temperatureCelsius: 32, windSpeedMs: 2.4 };
      break;
    case 'ev_charger':
      base.metrics = { loadPowerW: 7200, currentA: 32, voltageV: 230 };
      break;
    case 'esp32':
    case 'raspberry_pi':
      base.metrics = { powerOutputW: 100, temperatureCelsius: 28 };
      break;
    default:
      base.metrics = { powerOutputW: 0 };
  }
  return base;
}

export function gatewayHintForType(type: string): string | null {
  const needsGateway = ['inverter', 'battery', 'smart_meter', 'weather_sensor', 'ev_charger'];
  if (!needsGateway.includes(type)) return null;
  return 'This equipment usually does not speak MQTT natively. Run the reference gateway on a Raspberry Pi or ESP32 to read Modbus/vendor APIs and publish to the topics below.';
}
