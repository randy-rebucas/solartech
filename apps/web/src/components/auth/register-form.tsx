'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Building2 } from 'lucide-react';
import { registerWithApi } from '@/lib/auth/client';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { RegisterRequest } from '@solartech/shared';
import { postLoginPath } from '@/lib/dashboard-nav';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName:  z.string().min(2, 'Last name must be at least 2 characters'),
  email:     z.string().email('Invalid email address'),
  password:  z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  role: z.enum(['client', 'installer', 'solar_company']),
  organizationName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_LABELS = {
  client:       { label: 'Homeowner / Client',  desc: 'Monitor my solar system' },
  installer:    { label: 'Solar Installer',      desc: 'Manage installations' },
  solar_company:{ label: 'Solar Company',        desc: 'Full business management' },
} as const;

export function RegisterForm() {
  const router = useRouter();
  const setUser   = useAuthStore((s) => s.setUser);
  const setTokens = useAuthStore((s) => s.setTokens);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'client' },
  });

  const role = watch('role');

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const result = await registerWithApi(data as RegisterRequest);
      setUser(result.user);
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      router.push(postLoginPath(result.user.role));
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card p-8"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create account</h1>
        <p className="text-sm text-slate-400 mt-1">Get started with SolarTech for free</p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">I am a…</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(ROLE_LABELS) as [FormData['role'], typeof ROLE_LABELS[keyof typeof ROLE_LABELS]][]).map(([value, { label }]) => (
              <label
                key={value}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all text-center',
                  role === value
                    ? 'border-solar-500 bg-solar-500/10 text-solar-400'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20',
                )}
              >
                <input {...register('role')} type="radio" value={value} className="sr-only" />
                <span className="text-xs font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputField label="First name" error={errors.firstName?.message} icon={<User className="w-4 h-4" />}>
            <input
              {...register('firstName')}
              placeholder="Juan"
              className={inputCls(!!errors.firstName)}
            />
          </InputField>
          <InputField label="Last name" error={errors.lastName?.message}>
            <input
              {...register('lastName')}
              placeholder="Dela Cruz"
              className={inputCls(!!errors.lastName)}
            />
          </InputField>
        </div>

        {(role === 'installer' || role === 'solar_company') && (
          <InputField label="Company name" error={errors.organizationName?.message} icon={<Building2 className="w-4 h-4" />}>
            <input
              {...register('organizationName')}
              placeholder="SunPower Corp"
              className={inputCls(!!errors.organizationName)}
            />
          </InputField>
        )}

        <InputField label="Email" error={errors.email?.message} icon={<Mail className="w-4 h-4" />}>
          <input
            {...register('email')}
            type="email"
            placeholder="you@company.com"
            className={inputCls(!!errors.email)}
          />
        </InputField>

        <InputField label="Password" error={errors.password?.message} icon={<Lock className="w-4 h-4" />}>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              className={cn(inputCls(!!errors.password), 'pr-10')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </InputField>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full py-2.5 rounded-lg font-medium text-white transition-all mt-2',
            'bg-gradient-solar hover:opacity-90 active:scale-[0.98] shadow-glow',
            'focus:outline-none focus:ring-2 focus:ring-solar-500/50',
            isSubmitting && 'opacity-70 cursor-not-allowed',
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account…
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-solar-400 hover:text-solar-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-slate-500">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-slate-300">Terms</Link> and{' '}
        <Link href="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>.
      </p>
    </motion.div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border text-white placeholder:text-slate-500',
    'focus:outline-none focus:ring-2 focus:ring-solar-500/50 transition-all',
    hasError ? 'border-destructive' : 'border-white/10',
  );
}

function InputField({
  label,
  error,
  icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        )}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
