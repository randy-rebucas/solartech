export const SOLAR_SYSTEM_STATUS = [
  'planning',
  'installing',
  'active',
  'maintenance',
  'offline',
] as const;

export type SolarSystemStatus = (typeof SOLAR_SYSTEM_STATUS)[number];

export const SOLAR_SYSTEM_STATUS_CONFIG: Record<
  SolarSystemStatus,
  { label: string; color: string; dot: string }
> = {
  planning:    { label: 'Planning',    color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  installing:  { label: 'Installing',  color: 'text-yellow-500',       dot: 'bg-yellow-500' },
  active:      { label: 'Active',      color: 'text-solar-500',        dot: 'bg-solar-500' },
  maintenance: { label: 'Maintenance', color: 'text-orange-500',       dot: 'bg-orange-500' },
  offline:     { label: 'Offline',     color: 'text-destructive',      dot: 'bg-destructive' },
};

export function getSolarSystemStatusConfig(status: string) {
  return SOLAR_SYSTEM_STATUS_CONFIG[status as SolarSystemStatus] ?? SOLAR_SYSTEM_STATUS_CONFIG.planning;
}
