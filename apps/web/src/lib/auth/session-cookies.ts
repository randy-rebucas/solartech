import { cookies } from 'next/headers';
import type { AuthResponse } from '@solartech/shared';

export const AUTH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
} as const;

export async function setAuthCookies(result: AuthResponse) {
  if (!result.tokens) return;

  const cookieStore = await cookies();
  cookieStore.set('st_access_token', result.tokens.accessToken, {
    ...AUTH_COOKIE_OPTS,
    maxAge: result.tokens.expiresIn,
  });
  cookieStore.set('st_refresh_token', result.tokens.refreshToken, {
    ...AUTH_COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('st_access_token');
  cookieStore.delete('st_refresh_token');
}
