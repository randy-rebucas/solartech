import type { Metadata } from 'next';
import { QuotationsPage } from '@/components/quotations/quotations-page';

export const metadata: Metadata = { title: 'Solar Quotations' };

export default function Page() {
  return <QuotationsPage />;
}
