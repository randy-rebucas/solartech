'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { postLoginPath } from '@/lib/dashboard-nav';
import { cn } from '@/lib/utils';

export function MfaVerifyForm() {
  const router = useRouter();
  const setUser   = useAuthStore((s) => s.setUser);
  const setTokens = useAuthStore((s) => s.setTokens);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  function handleChange(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (next.every((d) => d !== '')) submit(next.join(''));
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  }

  async function submit(fullCode: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      const sessionToken = sessionStorage.getItem('mfa_session');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-mfa`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: fullCode, sessionToken }),
        },
      );
      if (!res.ok) throw new Error((await res.json()).message ?? 'Invalid code');
      const data = await res.json();
      sessionStorage.removeItem('mfa_session');
      setUser(data.user);
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      router.push(postLoginPath(data.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card p-8 text-center"
    >
      <ShieldCheck className="w-12 h-12 text-solar-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-white mb-1">Two-factor authentication</h1>
      <p className="text-sm text-slate-400 mb-8">
        Enter the 6-digit code from your authenticator app.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2 mb-6">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'w-11 h-14 text-center text-xl font-bold rounded-lg border bg-white/5 text-white',
              'focus:outline-none focus:ring-2 focus:ring-solar-500/50 transition-all',
              digit ? 'border-solar-500/60' : 'border-white/10',
            )}
          />
        ))}
      </div>

      {isSubmitting && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
        </div>
      )}
    </motion.div>
  );
}
