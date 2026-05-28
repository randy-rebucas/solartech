import type { Metadata } from 'next';
import { MaintenancePage } from '@/components/maintenance/maintenance-page';
export const metadata: Metadata = { title: 'Maintenance CRM' };
export default function Page() { return <MaintenancePage />; }
