import { GoogleAnalytics } from '@next/third-parties/google';
import { Suspense } from 'react';
import { GA_MEASUREMENT_ID } from '@/lib/gtag';
import { GoogleAnalyticsPageView } from './google-analytics-page-view';

export function SiteGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView gaId={GA_MEASUREMENT_ID} />
      </Suspense>
    </>
  );
}
