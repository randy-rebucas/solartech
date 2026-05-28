export type AnalyticsRange = '7d' | '30d' | '90d' | '1y';

export function rangeToDays(range: AnalyticsRange): number {
  switch (range) {
    case '7d':  return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y':  return 365;
    default:    return 30;
  }
}

export function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' });
}

export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
