import type { Metadata } from 'next';
import { SmartCityPage } from '@/components/smart-city/smart-city-page';
export const metadata: Metadata = { title: 'Smart City Analytics' };
export default function Page() { return <SmartCityPage />; }
