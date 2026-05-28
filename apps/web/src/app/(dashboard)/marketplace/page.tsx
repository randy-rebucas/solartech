import type { Metadata } from 'next';
import { MarketplacePage } from '@/components/marketplace/marketplace-page';
export const metadata: Metadata = { title: 'Installer Marketplace' };
export default function Page() { return <MarketplacePage />; }
