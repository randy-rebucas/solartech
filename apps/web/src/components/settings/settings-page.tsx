'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useGet, usePatch } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';
import { PageContainer } from '@/components/layout/page-container';
import type { SettingsTabId } from '@/lib/settings-tabs';
import { User, Bell, Shield, Key, Building2, Loader2, Check } from 'lucide-react';

const tabs = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'security' as const, label: 'Security', icon: Shield },
  { id: 'api' as const, label: 'API Keys', icon: Key },
  { id: 'organization' as const, label: 'Organization', icon: Building2 },
];

type Tab = SettingsTabId;

const iCls = 'w-full px-3 py-2.5 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40';

interface SettingsPageProps {
  initialTab?: Tab;
}

export function SettingsPage({ initialTab = 'profile' }: SettingsPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const { user } = useAuthStore();

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  function selectTab(next: Tab) {
    setTab(next);
    router.push(next === 'profile' ? '/settings/profile' : `/settings/${next}`);
  }

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="w-48 shrink-0 space-y-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => selectTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-solar-500/15 text-solar-400' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
              <t.icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex-1">
          {tab === 'profile' && <ProfileTab user={user} />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'api' && <ApiKeysTab />}
          {tab === 'organization' && <OrganizationTab />}
        </div>
      </div>
    </PageContainer>
  );
}

function ProfileTab({ user }: { user: any }) {
  const mutation = usePatch<any, any>([['users']]);
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' },
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel-card p-6">
      <h2 className="font-semibold text-lg mb-5">Profile Information</h2>
      <form onSubmit={handleSubmit(async (d) => mutation.mutateAsync({ url: `/api/v1/users/${user?.id ?? 'me'}`, data: d as any }))} className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-solar flex items-center justify-center text-white text-xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">First Name</label>
            <input {...register('firstName')} className={iCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Last Name</label>
            <input {...register('lastName')} className={iCls} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone Number</label>
          <input {...register('phone')} placeholder="+63 9xx xxx xxxx" className={iCls} />
        </div>
        <div className="pt-2">
          <button type="submit" disabled={mutation.isPending || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : mutation.isSuccess ? <Check className="w-4 h-4" /> : null}
            Save Changes
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function NotificationsTab() {
  const prefs = [
    { id: 'email_alerts', label: 'Device alerts via email', defaultChecked: true },
    { id: 'email_reports', label: 'Monthly energy reports', defaultChecked: true },
    { id: 'email_maintenance', label: 'Maintenance updates', defaultChecked: false },
    { id: 'push_alerts', label: 'Push notifications for critical alerts', defaultChecked: true },
    { id: 'push_system', label: 'System status changes', defaultChecked: false },
    { id: 'marketing', label: 'Product updates and news', defaultChecked: false },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel-card p-6">
      <h2 className="font-semibold text-lg mb-5">Notification Preferences</h2>
      <div className="space-y-4">
        {prefs.map((p) => (
          <label key={p.id} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">{p.label}</span>
            <div className="relative">
              <input type="checkbox" defaultChecked={p.defaultChecked} className="sr-only peer" />
              <div className="w-11 h-6 rounded-full bg-border peer-checked:bg-solar-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow peer-checked:translate-x-5 transition-transform" />
            </div>
          </label>
        ))}
      </div>
      <button className="mt-6 px-5 py-2.5 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90">Save Preferences</button>
    </motion.div>
  );
}

function SecurityTab() {
  const { register, handleSubmit } = useForm();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="panel-card p-6">
        <h2 className="font-semibold text-lg mb-5">Change Password</h2>
        <form className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Current Password</label>
            <input type="password" {...register('currentPassword')} className={iCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">New Password</label>
            <input type="password" {...register('newPassword')} className={iCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Confirm New Password</label>
            <input type="password" {...register('confirmPassword')} className={iCls} />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90">Update Password</button>
        </form>
      </div>
      <div className="panel-card p-6">
        <h2 className="font-semibold text-lg mb-2">Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security with TOTP-based 2FA.</p>
        <button className="px-5 py-2.5 rounded-lg border border-solar-500 text-solar-400 text-sm font-medium hover:bg-solar-500/10">Enable 2FA</button>
      </div>
    </motion.div>
  );
}

function ApiKeysTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-lg">API Keys</h2>
        <button disabled className="px-4 py-2 rounded-lg bg-accent text-muted-foreground text-sm font-medium cursor-not-allowed">Generate Key</button>
      </div>
      <p className="text-sm text-muted-foreground">API key management is not enabled yet. Use your session token for authenticated API access.</p>
    </motion.div>
  );
}

function OrganizationTab() {
  const { data: org } = useGet<{ name?: string; contactEmail?: string; address?: string }>(
    ['organizations', 'me'],
    '/api/v1/organizations/me',
  );
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', contactEmail: '', address: '' },
  });
  const patchOrg = usePatch<{ name?: string; contactEmail?: string; address?: string }, unknown>([['organizations', 'me']]);

  useEffect(() => {
    if (org) {
      reset({
        name: org.name ?? '',
        contactEmail: org.contactEmail ?? '',
        address: org.address ?? '',
      });
    }
  }, [org, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!org || typeof org !== 'object' || !('_id' in org)) return;
    const id = (org as { _id: string })._id;
    await patchOrg.mutateAsync({ url: `/api/v1/organizations/${id}`, data: values });
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel-card p-6">
      <h2 className="font-semibold text-lg mb-5">Organization Settings</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Organization Name</label>
          <input {...register('name')} className={iCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Contact Email</label>
          <input {...register('contactEmail')} type="email" className={iCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Address</label>
          <input {...register('address')} className={iCls} />
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90">Save Organization</button>
      </form>
    </motion.div>
  );
}
