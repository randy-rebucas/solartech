'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({ email: z.string().email('Invalid email address') });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      );
      if (!res.ok) throw new Error((await res.json()).message);
      setSent(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to send reset email');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card p-8"
    >
      {sent ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-solar-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-sm text-slate-400 mb-6">
            We've sent a password reset link to your email address.
          </p>
          <Link href="/login" className="text-solar-400 hover:text-solar-300 text-sm transition-colors">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Reset password</h1>
            <p className="text-sm text-slate-400 mt-1">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@company.com"
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border text-white placeholder:text-slate-500',
                    'focus:outline-none focus:ring-2 focus:ring-solar-500/50 transition-all',
                    errors.email ? 'border-destructive' : 'border-white/10',
                  )}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full py-2.5 rounded-lg font-medium text-white transition-all',
                'bg-gradient-solar hover:opacity-90 active:scale-[0.98] shadow-glow',
                isSubmitting && 'opacity-70 cursor-not-allowed',
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                </span>
              ) : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to sign in
            </Link>
          </p>
        </>
      )}
    </motion.div>
  );
}
