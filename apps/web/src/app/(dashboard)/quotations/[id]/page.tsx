import type { Metadata } from 'next';
import { QuotationDetailPage } from '@/components/quotations/quotation-detail-page';

export const metadata: Metadata = { title: 'Quotation Details' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <QuotationDetailPage quotationId={id} />;
}
