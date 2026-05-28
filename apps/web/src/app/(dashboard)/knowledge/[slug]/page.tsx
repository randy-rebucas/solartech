import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KnowledgeBaseArticle } from '@/components/knowledge-base/knowledge-base-article';
import { PageContainer } from '@/components/layout/page-container';
import { getAllArticleSlugs, getArticleBySlug } from '@/lib/knowledge-base';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Article not found' };
  return { title: article.title };
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <PageContainer>
      <KnowledgeBaseArticle article={article} basePath="/knowledge" variant="dashboard" />
    </PageContainer>
  );
}
