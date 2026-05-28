import type { Metadata } from 'next';
import { BillingPage } from '@/components/billing/billing-page';
export const metadata: Metadata = { title: 'Billing & Financing' };
export default function Page() { return <BillingPage />; }
