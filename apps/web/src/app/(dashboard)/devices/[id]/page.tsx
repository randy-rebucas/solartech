import type { Metadata } from 'next';
import { DeviceDetailPage } from '@/components/devices/device-detail-page';

export const metadata: Metadata = { title: 'Device Details' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <DeviceDetailPage deviceId={id} />;
}
