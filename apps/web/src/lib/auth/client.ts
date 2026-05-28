'use client';

import type { AuthResponse, LoginRequest, RegisterRequest } from '@solartech/shared';

async function postAuth(path: string, body: unknown): Promise<AuthResponse> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message ?? 'Request failed');
  }

  return data as AuthResponse;
}

/** Route handlers set httpOnly cookies; avoids Server Action ID drift during dev HMR. */
export function registerWithApi(data: RegisterRequest) {
  return postAuth('/api/auth/register', data);
}

export function loginWithApi(data: LoginRequest) {
  return postAuth('/api/auth/login', data);
}
