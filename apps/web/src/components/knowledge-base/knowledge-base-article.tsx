'use client';

import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import type { KbArticle } from '@/content/knowledge-base';
import { KB_CATEGORIES, getArticlesByCategory } from '@/lib/knowledge-base';
import { ArticleBody } from './article-body';
import { cn } from '@/lib/utils';

interface Props {
  article: KbArticle;
  basePath: string;
  variant?: 'marketing' | 'dashboard';
}

export function KnowledgeBaseArticle({ article, basePath, variant = 'marketing' }: Props) {
  const category = KB_CATEGORIES.find((c) => c.id === article.categoryId);
  const related = getArticlesByCategory(article.categoryId)
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  const wrapperClass =
    variant === 'marketing' ? 'max-w-3xl mx-auto px-6 py-12' : 'max-w-3xl';

  return (
    <div className={wrapperClass}>
      <Link
        href={basePath}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Knowledge Base
      </Link>

      <header className="mb-8 pb-8 border-b border-border">
        {category && (
          <span className="text-xs font-medium text-solar-500">{category.title}</span>
        )}
        <h1
          className={cn(
            'font-bold tracking-tight mt-2',
            variant === 'marketing' ? 'text-3xl md:text-4xl' : 'text-2xl',
          )}
        >
          {article.title}
        </h1>
        <p className="text-muted-foreground mt-3">{article.summary}</p>
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.readMinutes} min read
          </span>
          <span>Updated {article.updatedAt}</span>
          {article.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-accent border border-border">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <ArticleBody blocks={article.body} />

      {related.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Related articles
          </h2>
          <ul className="space-y-2">
            {related.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`${basePath}/${a.slug}`}
                  className="text-sm font-medium hover:text-solar-500 transition-colors"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
