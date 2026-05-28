'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { usePost, useSolarSystems } from '@/hooks/use-api';
import { DEVICE_TYPES } from '@/lib/device-status';

type DeviceForm = {
  name: string;
  type: string;
  serialNumber: string;
  solarSystemId?: string;
  firmware?: string;
  macAddress?: string;
  ipAddress?: string;
  latitude?: string;
  longitude?: string;
};

type CreateDevicePayload = {
  name: string;
  type: string;
  serialNumber: string;
  solarSystemId?: string;
  firmware?: string;
  macAddress?: string;
  ipAddress?: string;
  latitude?: number;
  longitude?: number;
};

export function AddDeviceModal({ onClose }: { onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const mutation = usePost<CreateDevicePayload, unknown>('/api/v1/devices', [['devices']]);
  const { data: systemsRaw } = useSolarSystems();
  const systems: Array<{ _id: string; name: string }> =
    (systemsRaw as { data?: Array<{ _id: string; name: string }> })?.data ?? [];
  const { register, handleSubmit } = useForm<DeviceForm>({
    defaultValues: {
      type: 'inverter',
      firmware: '1.0.0',
      name: '',
      serialNumber: '',
      macAddress: '',
      ipAddress: '',
      latitude: '',
      longitude: '',
      solarSystemId: '',
    },
  });

  const iCls = 'w-full px-3 py-2.5 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40';

  async function onSubmit(data: DeviceForm) {
    setServerError(null);
    try {
      await mutation.mutateAsync({
        name: data.name,
        type: data.type,
        serialNumber: data.serialNumber,
        ...(data.solarSystemId?.trim() ? { solarSystemId: data.solarSystemId.trim() } : {}),
        ...(data.firmware ? { firmware: data.firmware } : {}),
        ...(data.macAddress?.trim() ? { macAddress: data.macAddress.trim() } : {}),
        ...(data.ipAddress?.trim() ? { ipAddress: data.ipAddress.trim() } : {}),
        ...(data.latitude?.trim() ? { latitude: Number(data.latitude) } : {}),
        ...(data.longitude?.trim() ? { longitude: Number(data.longitude) } : {}),
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to register device');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md panel-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Register Device</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{serverError}</p>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Device Name</label>
            <input {...register('name', { required: true })} placeholder="Main Inverter" className={iCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Device Type</label>
              <select {...register('type')} className={iCls}>
                {DEVICE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-background capitalize">{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Serial Number</label>
              <input {...register('serialNumber', { required: true })} placeholder="SN-001" className={iCls} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Solar system</label>
            <select {...register('solarSystemId')} className={iCls}>
              <option value="">None (use default in MQTT topics)</option>
              {systems.map((s) => (
                <option key={s._id} value={s._id} className="bg-background">
                  {s.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Links telemetry to a system. Required for accurate topic paths.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Firmware</label>
              <input {...register('firmware')} placeholder="1.0.0" className={iCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">MAC Address</label>
              <input {...register('macAddress')} placeholder="AA:BB:CC:DD:EE:FF" className={iCls} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">IP Address</label>
              <input {...register('ipAddress')} placeholder="192.168.1.10" className={iCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Latitude</label>
              <input {...register('latitude')} placeholder="14.5995" className={iCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Longitude</label>
              <input {...register('longitude')} placeholder="120.9842" className={iCls} />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            GPS is optional but recommended for fleet tracking and weather-correlation diagnostics.
          </p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm hover:bg-accent">Cancel</button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90 disabled:opacity-60">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Register'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
