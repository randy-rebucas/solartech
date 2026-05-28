import type { Metadata } from 'next';
import { DiyGuidePage } from '@/components/diy/diy-guide-page';

export const metadata: Metadata = {
  title: 'DIY Solar Guide | SolarTech',
  description:
    'Step-by-step home solar installation guide for the Philippines — assessment, permits, install, and maintenance.',
};

export default function DiyPage() {
  return <DiyGuidePage />;
}
