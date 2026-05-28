import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SettingsPage } from '@/components/settings/settings-page';
import { isSettingsTab } from '@/lib/settings-tabs';

export const metadata: Metadata = { title: 'Settings' };

interface Props {
  params: Promise<{ tab: string }>;
}

export default async function SettingsTabPage({ params }: Props) {
  const { tab } = await params;
  if (!isSettingsTab(tab)) notFound();
  return <SettingsPage initialTab={tab} />;
}
