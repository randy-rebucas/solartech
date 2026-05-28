import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KnowledgeBaseArticle } from '@/components/knowledge-base/knowledge-base-article';
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
  return {
    title: `${article.title} | SolarTech Help`,
    description: article.summary,
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <KnowledgeBaseArticle article={article} basePath="/help" variant="marketing" />
  );
}
