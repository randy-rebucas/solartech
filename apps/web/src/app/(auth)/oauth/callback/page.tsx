'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { postLoginPath } from '@/lib/dashboard-nav';
import type { User } from '@solartech/shared';

type OAuthPayload = {
  user?: User;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    const payload = searchParams.get('payload');
    if (!payload) {
      router.replace('/login?error=oauth_payload_missing');
      return;
    }

    try {
      const decoded = decodeBase64Url(payload);
      const data = JSON.parse(decoded) as OAuthPayload;
      if (!data.user || !data.tokens?.accessToken || !data.tokens?.refreshToken) {
        router.replace('/login?error=oauth_payload_invalid');
        return;
      }

      setUser(data.user);
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      router.replace(postLoginPath(data.user.role));
    } catch {
      router.replace('/login?error=oauth_callback_parse_failed');
    }
  }, [router, searchParams, setTokens, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Completing OAuth sign-in...</p>
    </div>
  );
}
