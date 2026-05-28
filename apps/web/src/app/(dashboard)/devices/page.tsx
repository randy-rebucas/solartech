import type { Metadata } from 'next';
import { DevicesPage } from '@/components/devices/devices-page';
export const metadata: Metadata = { title: 'Devices & IoT' };
export default function Page() { return <DevicesPage />; }
