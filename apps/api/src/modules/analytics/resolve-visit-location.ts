import type { Request } from 'express';

export type ClientLocationMeta = {
  timezone?: string;
  locale?: string;
};

export type ResolvedVisitLocation = {
  country: string;
  region: string;
  city: string;
  label: string;
};

const TIMEZONE_HINTS: Record<string, { country: string; region: string; city: string }> = {
  'Asia/Manila': { country: 'PH', region: 'NCR', city: 'Manila' },
  'Asia/Singapore': { country: 'SG', region: 'Central', city: 'Singapore' },
  'Asia/Tokyo': { country: 'JP', region: 'Kanto', city: 'Tokyo' },
  'America/New_York': { country: 'US', region: 'NY', city: 'New York' },
  'Europe/London': { country: 'GB', region: 'England', city: 'London' },
};

const LOCALE_COUNTRY: Record<string, string> = {
  'en-PH': 'PH',
  'fil-PH': 'PH',
  'en-US': 'US',
  'en-GB': 'GB',
};

const COUNTRY_NAMES: Record<string, string> = {
  PH: 'Philippines',
  SG: 'Singapore',
  US: 'United States',
  GB: 'United Kingdom',
  JP: 'Japan',
  Unknown: 'Unknown',
};

function headerValue(req: Request, name: string) {
  const value = req.headers[name.toLowerCase()];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function formatLocationLabel(country: string, region: string, city: string) {
  const countryName = COUNTRY_NAMES[country] ?? country;
  if (city && city !== country && city !== countryName) return `${city}, ${countryName}`;
  if (region && region !== country && region !== countryName) return `${region}, ${countryName}`;
  return countryName;
}

export function resolveVisitLocation(req: Request, meta?: ClientLocationMeta): ResolvedVisitLocation {
  const country =
    headerValue(req, 'cf-ipcountry') ??
    headerValue(req, 'x-vercel-ip-country') ??
    (meta?.locale ? LOCALE_COUNTRY[meta.locale] : undefined) ??
    (meta?.timezone ? TIMEZONE_HINTS[meta.timezone]?.country : undefined) ??
    'Unknown';

  const region =
    headerValue(req, 'x-vercel-ip-country-region') ??
    (meta?.timezone ? TIMEZONE_HINTS[meta.timezone]?.region : undefined) ??
    '';

  const city =
    headerValue(req, 'x-vercel-ip-city') ??
    (meta?.timezone ? TIMEZONE_HINTS[meta.timezone]?.city : undefined) ??
    '';

  return {
    country,
    region,
    city,
    label: formatLocationLabel(country, region, city),
  };
}
