export function rangeToDays(range?: string): number {
  switch (range) {
    case '7d':  return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y':  return 365;
    default:    return 30;
  }
}

export function rangeToDates(range?: string, from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date();
  if (from && to) {
    return { from: new Date(from), to: new Date(to) };
  }
  const days = rangeToDays(range);
  return { from: new Date(now.getTime() - days * 86400_000), to: now };
}
