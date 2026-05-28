import type { Metadata } from 'next';
import { CalculatorsPage } from '@/components/calculators/calculators-page';

export const metadata: Metadata = {
  title: 'Solar Calculators | SolarTech',
  description:
    'Free Philippine solar calculators — system sizing, ROI, battery backup, and energy production estimates.',
};

export default function CalculatorsRoute() {
  return <CalculatorsPage />;
}
