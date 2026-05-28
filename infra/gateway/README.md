# Solartech edge gateway (reference)

Use this folder on a **Raspberry Pi**, **ESP32 companion**, or any Linux host that can reach your MQTT broker. It publishes sample telemetry so a registered device shows **online** in the dashboard.

Industrial gear (inverters, batteries, smart meters) usually needs a **protocol adapter** on the gateway (Modbus RTU/TCP, SunSpec, vendor REST). This script shows the **MQTT contract** only; replace `sampleMetrics()` with real readings.

## Prerequisites

1. Register the device in **Devices & IoT** and open its detail page.
2. Copy **organization ID**, **system ID**, **MQTT client ID**, and topics from **Connect this device**.
3. Run Mosquitto (or your broker) and set `MQTT_ENABLED=true` on the API.

## Quick start

```bash
cd infra/gateway
npm install

export ORG_ID="<from dashboard>"
export SYSTEM_ID="<solar system id or omit for default>"
export MQTT_CLIENT_ID="<from device record>"
export MQTT_BROKER_URL="mqtt://127.0.0.1:1883"
export MQTT_USERNAME="solartech"
export MQTT_PASSWORD="solartech_dev"

npm run publish-once    # single telemetry + status
npm run publish-loop    # every 30s (INTERVAL_MS=60000 to change)
```

## Topic layout

| Message   | Topic |
|-----------|--------|
| Telemetry | `solartech/{orgId}/{systemId}/{mqttClientId}/telemetry` |
| Status    | `solartech/{orgId}/{systemId}/{mqttClientId}/status` |
| Commands  | `solartech/{orgId}/{systemId}/{mqttClientId}/command` (subscribe) |

Payloads must be JSON. Telemetry example:

```json
{
  "timestamp": "2026-05-28T12:00:00Z",
  "metrics": {
    "powerOutputW": 4200,
    "voltageV": 230,
    "energyTodayKwh": 18.4
  }
}
```

## Device-type notes

| Type | Typical connection |
|------|-------------------|
| **esp32** / **raspberry_pi** | Run this script or embed MQTT in firmware; publish directly. |
| **inverter** / **battery** | Gateway polls Modbus/API; one logical device per registered `mqttClientId`. |
| **smart_meter** | Pulse counter or Modbus on gateway → `gridPowerW`, `energyTodayKwh`. |
| **weather_sensor** | RS485 or I2C on gateway → `irradianceWm2`, `temperatureCelsius`. |

## systemd (optional)

Run `publish-loop` as a service on the Pi so telemetry continues after reboot. Point `WorkingDirectory` at this directory and pass the same environment variables.
