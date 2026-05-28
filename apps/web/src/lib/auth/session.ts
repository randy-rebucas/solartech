import { cookies } from 'next/headers';
import type { User } from '@solartech/shared';
import { getServerApiUrl } from '@/lib/server-api';

export interface Session {
  user: User;
  accessToken: string;
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('st_access_token')?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${getServerApiUrl()}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const user: User = await res.json();
    return { user, accessToken: token };
  } catch {
    return null;
  }
}
