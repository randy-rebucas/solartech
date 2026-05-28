'use client';

import { useState } from 'react';
import { Copy, Check, Radio, AlertTriangle } from 'lucide-react';
import { useGet } from '@/hooks/use-api';
import {
  MQTT_TOPICS,
  gatewayHintForType,
  resolveMqttSystemId,
  sampleTelemetryPayload,
} from '@/lib/device-mqtt';
import { cn } from '@/lib/utils';

type IotConnectionInfo = {
  enabled: boolean;
  brokerUrl: string;
  username: string | null;
  topicPrefix: string;
  qos: number;
  note: string;
};

type DeviceConnectPanelProps = {
  organizationId: string;
  solarSystemId?: string | { _id: string };
  mqttClientId: string;
  deviceType: string;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-xs text-solar-500 hover:underline"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <code className="block text-xs font-mono bg-accent/80 rounded-lg px-3 py-2 break-all">{value}</code>
    </div>
  );
}

function JsonBlock({ label, payload }: { label: string; payload: object }) {
  const text = JSON.stringify(payload, null, 2);
  return <CopyField label={label} value={text} />;
}

export function DeviceConnectPanel({
  organizationId,
  solarSystemId,
  mqttClientId,
  deviceType,
}: DeviceConnectPanelProps) {
  const { data: iotInfo } = useGet<IotConnectionInfo>(
    ['iot', 'connection-info'],
    '/api/v1/iot/connection-info',
  );

  const systemId = resolveMqttSystemId(solarSystemId);
  const topics = {
    telemetry: MQTT_TOPICS.telemetry(organizationId, systemId, mqttClientId),
    status: MQTT_TOPICS.status(organizationId, systemId, mqttClientId),
    alert: MQTT_TOPICS.alert(organizationId, systemId, mqttClientId),
    command: MQTT_TOPICS.command(organizationId, systemId, mqttClientId),
  };

  const gatewayHint = gatewayHintForType(deviceType);
  const telemetrySample = sampleTelemetryPayload(deviceType);
  const statusSample = { status: 'online' };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-solar-500" />
        <h2 className="text-sm font-semibold">Connect this device</h2>
      </div>

      {iotInfo && !iotInfo.enabled && (
        <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{iotInfo.note}</p>
        </div>
      )}

      {systemId === 'default' && (
        <p className="text-xs text-muted-foreground rounded-lg bg-accent/50 px-3 py-2">
          No solar system linked — topics use <span className="font-mono">default</span> as the system
          segment. Link a system when registering (or re-register) for cleaner routing.
        </p>
      )}

      {gatewayHint && (
        <p className="text-xs text-muted-foreground leading-relaxed">{gatewayHint}</p>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">MQTT broker</dt>
          <dd className="mt-0.5 font-mono text-xs break-all">
            {iotInfo?.brokerUrl ?? 'mqtt://127.0.0.1:1883'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Username</dt>
          <dd className="mt-0.5 font-mono text-xs">{iotInfo?.username ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Organization ID</dt>
          <dd className="mt-0.5 font-mono text-xs break-all">{organizationId}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">System ID (topic segment)</dt>
          <dd className="mt-0.5 font-mono text-xs break-all">{systemId}</dd>
        </div>
      </dl>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Publish topics</p>
        <CopyField label="Telemetry (QoS 1)" value={topics.telemetry} />
        <CopyField label="Status" value={topics.status} />
        <CopyField label="Alerts" value={topics.alert} />
        <CopyField label="Subscribe — commands from cloud" value={topics.command} />
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payload examples</p>
        <JsonBlock label="Telemetry JSON" payload={telemetrySample} />
        <JsonBlock label="Status JSON" payload={statusSample} />
      </div>

      <p className={cn('text-xs text-muted-foreground')}>
        After the first telemetry or status message, this device should appear{' '}
        <span className="text-solar-500">online</span>. See{' '}
        <code className="text-[11px]">infra/gateway/README.md</code> for a Raspberry Pi reference script.
      </p>
    </div>
  );
}
