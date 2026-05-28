import { NextResponse } from 'next/server';
import { apiUnreachableMessage, getServerApiUrl } from '@/lib/server-api';
import { setAuthCookies } from '@/lib/auth/session-cookies';
import type { AuthResponse } from '@solartech/shared';

export async function proxyAuthPost(
  nestPath: string,
  body: unknown,
  options?: { setCookies?: boolean | ((result: AuthResponse) => boolean) },
) {
  try {
    let res: Response;
    try {
      res = await fetch(`${getServerApiUrl()}${nestPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      return NextResponse.json(
        { message: apiUnreachableMessage() },
        { status: 503 },
      );
    }

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        typeof payload.message === 'string'
          ? payload.message
          : Array.isArray(payload.message)
            ? payload.message.join(', ')
            : 'Request failed';
      return NextResponse.json({ message }, { status: res.status });
    }

    const result = payload as AuthResponse;
    const shouldSetCookies =
      typeof options?.setCookies === 'function'
        ? options.setCookies(result)
        : options?.setCookies !== false;

    if (shouldSetCookies) {
      await setAuthCookies(result);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[proxyAuthPost]', err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Registration failed' },
      { status: 500 },
    );
  }
}
