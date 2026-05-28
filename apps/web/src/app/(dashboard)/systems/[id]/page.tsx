import type { Metadata } from 'next';
import { SystemDetailPage } from '@/components/systems/system-detail-page';

export const metadata: Metadata = { title: 'System Details' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <SystemDetailPage systemId={id} />;
}
