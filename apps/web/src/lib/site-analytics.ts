import { publicApi } from '@/lib/public-api';

const VISIT_KEY = 'solartech_visit_tracked';
const STATS_SEEN_KEY = 'solartech_stats_seen';

type SiteEventType = 'visit' | 'pageview' | 'click';

function clientMeta() {
  if (typeof window === 'undefined') return {};
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
  };
}

export async function trackSiteEvent(
  type: SiteEventType,
  extra?: { path?: string },
): Promise<boolean> {
  try {
    await publicApi.post('/api/v1/analytics/track', {
      type,
      ...clientMeta(),
      ...extra,
    });
    return true;
  } catch {
    return false;
  }
}

export async function trackSiteVisit(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (sessionStorage.getItem(VISIT_KEY)) return false;

  const ok = await trackSiteEvent('visit');
  if (ok) sessionStorage.setItem(VISIT_KEY, '1');
  return ok;
}

export async function trackSitePageView(path: string): Promise<boolean> {
  return trackSiteEvent('pageview', { path });
}

export async function trackSiteClick(): Promise<boolean> {
  return trackSiteEvent('click');
}

/** True when the user has never visited the marketing site before. */
export function isNewSiteVisitor(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !localStorage.getItem(STATS_SEEN_KEY);
  } catch {
    return !sessionStorage.getItem(STATS_SEEN_KEY);
  }
}

export function markStatsWidgetSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_SEEN_KEY, '1');
  } catch {
    sessionStorage.setItem(STATS_SEEN_KEY, '1');
  }
}
