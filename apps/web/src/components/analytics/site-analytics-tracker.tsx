'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { trackSiteClick, trackSitePageView, trackSiteVisit } from '@/lib/site-analytics';

const PUBLIC_STATS_KEY = ['analytics', 'public-stats'] as const;

export function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const clickBuffer = useRef(0);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visitSent = useRef(false);

  const refreshStats = () => {
    queryClient.invalidateQueries({ queryKey: [...PUBLIC_STATS_KEY] });
  };

  useEffect(() => {
    if (visitSent.current) return;
    visitSent.current = true;
    trackSiteVisit().then((ok) => {
      if (ok) refreshStats();
    });
  }, [queryClient]);

  useEffect(() => {
    trackSitePageView(pathname).then((ok) => {
      if (ok) refreshStats();
    });
  }, [pathname, queryClient]);

  useEffect(() => {
    const flushClicks = async () => {
      if (clickBuffer.current <= 0) return;
      const count = clickBuffer.current;
      clickBuffer.current = 0;

      let tracked = 0;
      for (let i = 0; i < count; i += 1) {
        if (await trackSiteClick()) tracked += 1;
      }
      if (tracked > 0) refreshStats();
    };

    const onClick = () => {
      clickBuffer.current += 1;
      if (clickBuffer.current >= 5) {
        flushClicks();
        if (flushTimer.current) {
          clearTimeout(flushTimer.current);
          flushTimer.current = null;
        }
        return;
      }
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(flushClicks, 2000);
    };

    document.addEventListener('click', onClick, { passive: true });
    return () => {
      document.removeEventListener('click', onClick);
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushClicks();
    };
  }, [queryClient]);

  return null;
}
