#!/usr/bin/env node
/**
 * Reference edge publisher for Solartech IoT.
 *
 * Copy values from the device detail page ("Connect this device") or set env vars.
 * For inverters/meters, replace the sample metrics with readings from Modbus/vendor APIs.
 *
 * Usage:
 *   cd infra/gateway && npm install
 *   ORG_ID=... SYSTEM_ID=... MQTT_CLIENT_ID=... npm run publish-once
 *   ORG_ID=... SYSTEM_ID=... MQTT_CLIENT_ID=... npm run publish-loop
 */

import mqtt from 'mqtt';

const orgId = process.env.ORG_ID;
const systemId = process.env.SYSTEM_ID ?? 'default';
const mqttClientId = process.env.MQTT_CLIENT_ID;
const brokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://127.0.0.1:1883';
const username = process.env.MQTT_USERNAME;
const password = process.env.MQTT_PASSWORD;
const loop = process.argv.includes('--loop');
const intervalMs = parseInt(process.env.INTERVAL_MS ?? '30000', 10);

if (!orgId || !mqttClientId) {
  console.error('Required: ORG_ID, MQTT_CLIENT_ID. Optional: SYSTEM_ID (default), MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD');
  process.exit(1);
}

const prefix = `solartech/${orgId}/${systemId}/${mqttClientId}`;
const telemetryTopic = `${prefix}/telemetry`;
const statusTopic = `${prefix}/status`;

function sampleMetrics() {
  return {
    powerOutputW: 2000 + Math.round(Math.random() * 2500),
    voltageV: 228 + Math.round(Math.random() * 6),
    energyTodayKwh: 10 + Math.random() * 8,
    temperatureCelsius: 28 + Math.random() * 6,
  };
}

function publish(client) {
  const ts = new Date().toISOString();
  const telemetry = JSON.stringify({ timestamp: ts, metrics: sampleMetrics() });
  const status = JSON.stringify({ status: 'online' });

  client.publish(telemetryTopic, telemetry, { qos: 1 }, (err) => {
    if (err) console.error('telemetry publish failed', err);
    else console.log(`[${ts}] telemetry → ${telemetryTopic}`);
  });
  client.publish(statusTopic, status, { qos: 1 });
}

const client = mqtt.connect(brokerUrl, {
  clientId: `gateway-${mqttClientId}-${Date.now().toString(36)}`,
  username,
  password,
  reconnectPeriod: 3000,
  clean: true,
});

client.on('connect', () => {
  console.log(`Connected to ${brokerUrl}`);
  console.log(`Publishing as device id (topic segment): ${mqttClientId}`);

  client.subscribe(`${prefix}/command`, { qos: 1 }, (err) => {
    if (err) console.error('command subscribe failed', err);
    else console.log(`Listening for commands on ${prefix}/command`);
  });

  publish(client);
  if (loop) {
    setInterval(() => publish(client), intervalMs);
    console.log(`Looping every ${intervalMs}ms (Ctrl+C to stop)`);
  } else {
    setTimeout(() => client.end(), 1500);
  }
});

client.on('message', (topic, payload) => {
  console.log(`Command received on ${topic}:`, payload.toString());
});

client.on('error', (err) => console.error('MQTT error', err.message));
