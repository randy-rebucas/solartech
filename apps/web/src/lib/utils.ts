import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-PH').format(n);
}

export function formatKwh(kwh: number): string {
  if (kwh >= 1_000_000) return `${(kwh / 1_000_000).toFixed(2)} GWh`;
  if (kwh >= 1_000)     return `${(kwh / 1_000).toFixed(1)} MWh`;
  return `${kwh.toFixed(1)} kWh`;
}

export function formatPower(watts: number): string {
  if (watts >= 1_000_000) return `${(watts / 1_000_000).toFixed(2)} MW`;
  if (watts >= 1_000)     return `${(watts / 1_000).toFixed(1)} kW`;
  return `${watts.toFixed(0)} W`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    online:      'text-solar-500',
    active:      'text-solar-500',
    offline:     'text-destructive',
    error:       'text-destructive',
    warning:     'text-yellow-500',
    maintenance: 'text-yellow-500',
    pending:     'text-energy-400',
    installing:  'text-energy-400',
  };
  return map[status] ?? 'text-muted-foreground';
}

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    online:   'default',
    active:   'default',
    offline:  'destructive',
    error:    'destructive',
    warning:  'secondary',
    pending:  'outline',
  };
  return map[status] ?? 'secondary';
}
