import type { Metadata } from 'next';
import { KnowledgeBaseHome } from '@/components/knowledge-base/knowledge-base-home';
import { PageContainer } from '@/components/layout/page-container';

export const metadata: Metadata = { title: 'Knowledge Base' };

export default function KnowledgePage() {
  return (
    <PageContainer>
      <KnowledgeBaseHome variant="dashboard" basePath="/knowledge" />
    </PageContainer>
  );
}
