import type { Metadata } from 'next';
import { MarketplaceLeadsPage } from '@/components/marketplace/marketplace-leads-page';

export const metadata: Metadata = { title: 'Marketplace Leads' };

export default function Page() {
  return <MarketplaceLeadsPage />;
}
