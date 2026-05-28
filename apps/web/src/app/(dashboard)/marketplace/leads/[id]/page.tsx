import type { Metadata } from 'next';
import { MarketplaceLeadDetailPage } from '@/components/marketplace/marketplace-lead-detail-page';

export const metadata: Metadata = { title: 'Lead Detail' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MarketplaceLeadDetailPage leadId={id} />;
}
