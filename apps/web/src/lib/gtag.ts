declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function pageview(gaId: string, url: string) {
  window.gtag?.('config', gaId, { page_path: url });
}

export function gaEvent(
  action: string,
  params?: Record<string, string | number | boolean>,
) {
  window.gtag?.('event', action, params);
}
