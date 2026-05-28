import type { Metadata } from 'next';
import { InstallerProfilePage } from '@/components/marketplace/installer-profile-page';

export const metadata: Metadata = { title: 'Installer Profile' };

export default async function Page({ params }: { params: Promise<{ installerId: string }> }) {
  const { installerId } = await params;
  return <InstallerProfilePage installerId={installerId} />;
}
