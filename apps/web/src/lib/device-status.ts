export const DEVICE_STATUSES = [
  'online',
  'offline',
  'warning',
  'error',
  'maintenance',
] as const;

export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const DEVICE_TYPES = [
  'inverter',
  'battery',
  'smart_meter',
  'weather_sensor',
  'ev_charger',
  'esp32',
  'raspberry_pi',
] as const;

export const DEVICE_STATUS_CONFIG: Record<
  DeviceStatus,
  { label: string; text: string; bg: string }
> = {
  online:      { label: 'Online',      text: 'text-solar-500',    bg: 'bg-solar-500/10' },
  offline:     { label: 'Offline',     text: 'text-destructive',  bg: 'bg-destructive/10' },
  warning:     { label: 'Warning',     text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  error:       { label: 'Error',       text: 'text-destructive',  bg: 'bg-destructive/10' },
  maintenance: { label: 'Maintenance', text: 'text-orange-500',  bg: 'bg-orange-500/10' },
};

export function getDeviceStatusConfig(status: string) {
  return DEVICE_STATUS_CONFIG[status as DeviceStatus] ?? DEVICE_STATUS_CONFIG.offline;
}

export function formatDeviceType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
