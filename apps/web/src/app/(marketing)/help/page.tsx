import type { Metadata } from 'next';
import { KnowledgeBaseHome } from '@/components/knowledge-base/knowledge-base-home';

export const metadata: Metadata = {
  title: 'Help Center | SolarTech',
  description: 'Documentation and guides for SolarTech solar management platform.',
};

export default function HelpPage() {
  return <KnowledgeBaseHome variant="marketing" basePath="/help" />;
}
