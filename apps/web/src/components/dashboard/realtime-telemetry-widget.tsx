'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Wifi, WifiOff } from 'lucide-react';
import { useTelemetryLatest } from '@/hooks/use-api';
import { formatPower, formatKwh } from '@/lib/utils';

interface DataPoint { t: number; v: number }

function useRealtimePower(deviceId: string) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { data: latest } = useTelemetryLatest(deviceId);

  useEffect(() => {
    if (!deviceId || !process.env.NEXT_PUBLIC_WS_URL) return;

    const url = `${process.env.NEXT_PUBLIC_WS_URL}/telemetry?deviceId=${deviceId}`;
    let ws: WebSocket;

    function connect() {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen  = () => setWsConnected(true);
      ws.onclose = () => { setWsConnected(false); setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        try {
          const { powerOutputW } = JSON.parse(e.data);
          setData((prev) => [...prev.slice(-59), { t: Date.now(), v: powerOutputW ?? 0 }]);
        } catch { /* ignore */ }
      };
    }

    connect();
    return () => ws?.close();
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId || !latest?.metrics) return;
    if (process.env.NEXT_PUBLIC_WS_URL && wsConnected) return;

    const power = latest.metrics.powerOutputW ?? 0;
    setData((prev) => [...prev.slice(-59), { t: Date.now(), v: power }]);
  }, [latest, deviceId, wsConnected]);

  const connected = !!deviceId && (wsConnected || !!latest?.metrics);
  return { data, connected, metrics: latest?.metrics };
}

interface Props {
  deviceId?: string;
}

export function RealtimeTelemetryWidget({ deviceId = '' }: Props) {
  const { data, connected, metrics } = useRealtimePower(deviceId);
  const displayPower = data[data.length - 1]?.v ?? metrics?.powerOutputW ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel-card p-5 flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold">Live Inverter</h2>
          <p className="text-xs text-muted-foreground">
            {deviceId ? 'Real-time output' : 'Add an inverter device to monitor'}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs ${connected ? 'text-solar-500' : 'text-destructive'}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {deviceId ? (connected ? 'Live' : 'Offline') : 'No device'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={Math.round(displayPower / 100)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center my-4"
        >
          <p className="text-4xl font-bold gradient-text">{formatPower(displayPower)}</p>
          <p className="text-xs text-muted-foreground mt-1">Current output</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex-1 min-h-[100px]">
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Waiting for telemetry…</p>
        ) : (
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="#22c55e"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip
                formatter={(v: number) => [formatPower(v), 'Output']}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                labelFormatter={() => ''}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
        {[
          { label: 'Today', value: metrics?.energyTodayKwh != null ? formatKwh(metrics.energyTodayKwh) : '—' },
          { label: 'Peak', value: metrics?.powerOutputW != null ? formatPower(metrics.powerOutputW) : '—' },
          { label: 'Freq', value: metrics?.frequencyHz != null ? `${metrics.frequencyHz.toFixed(1)} Hz` : '—' },
          { label: 'Temp', value: metrics?.temperatureCelsius != null ? `${Math.round(metrics.temperatureCelsius)} °C` : '—' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-xs font-medium">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
