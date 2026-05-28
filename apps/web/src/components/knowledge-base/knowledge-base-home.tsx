'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Clock, Search } from 'lucide-react';
import {
  KB_CATEGORIES,
  getArticlesByCategory,
  getFeaturedArticles,
  searchArticles,
} from '@/lib/knowledge-base';
import { CategoryIcon } from './category-icon';
import { cn } from '@/lib/utils';

type Variant = 'marketing' | 'dashboard';

interface Props {
  variant?: Variant;
  basePath?: string;
}

export function KnowledgeBaseHome({ variant = 'marketing', basePath }: Props) {
  const prefix = basePath ?? (variant === 'dashboard' ? '/knowledge' : '/help');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    let list = searchArticles(query);
    if (activeCategory) list = list.filter((a) => a.categoryId === activeCategory);
    return list;
  }, [query, activeCategory]);

  const featured = getFeaturedArticles();

  const wrapperClass =
    variant === 'marketing'
      ? 'max-w-5xl mx-auto px-6 py-12'
      : 'space-y-6';

  return (
    <div className={wrapperClass}>
      <div className={variant === 'dashboard' ? '' : 'text-center mb-10'}>
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4',
            'bg-solar-500/10 text-solar-500 border border-solar-500/20',
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Knowledge Base
        </div>
        <h1
          className={cn(
            'font-bold tracking-tight',
            variant === 'marketing' ? 'text-4xl md:text-5xl' : 'text-2xl',
          )}
        >
          How can we help?
        </h1>
        <p
          className={cn(
            'text-muted-foreground mt-2',
            variant === 'marketing' && 'max-w-xl mx-auto',
          )}
        >
          Guides for systems, IoT, quotations, billing, and more.
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40"
          aria-label="Search knowledge base"
        />
      </div>

      {!query && !activeCategory && featured.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Popular articles
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map((article) => (
              <ArticleCard key={article.slug} href={`${prefix}/${article.slug}`} article={article} />
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            !activeCategory
              ? 'bg-solar-500/15 border-solar-500/30 text-solar-500'
              : 'border-border text-muted-foreground hover:bg-accent',
          )}
        >
          All
        </button>
        {KB_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              activeCategory === cat.id
                ? 'bg-solar-500/15 border-solar-500/30 text-solar-500'
                : 'border-border text-muted-foreground hover:bg-accent',
            )}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {!query && !activeCategory && (
        <section className="mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Browse by category
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KB_CATEGORIES.map((cat) => {
              const count = getArticlesByCategory(cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className="interactive-card p-5 rounded-xl text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-solar-500/15 flex items-center justify-center text-solar-500 mb-3">
                    <CategoryIcon name={cat.icon} />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-solar-500 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{count} articles</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          {query ? `Results (${results.length})` : activeCategory ? 'Articles' : 'All articles'}
        </h2>
        {results.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            No articles match your search. Try different keywords.
          </p>
        ) : (
          <div className="space-y-2">
            {results.map((article) => (
              <ArticleCard key={article.slug} href={`${prefix}/${article.slug}`} article={article} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ArticleCard({
  href,
  article,
  compact,
}: {
  href: string;
  article: { slug: string; title: string; summary: string; readMinutes: number; categoryId: string };
  compact?: boolean;
}) {
  const cat = KB_CATEGORIES.find((c) => c.id === article.categoryId);
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        href={href}
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors group',
          compact && 'py-3',
        )}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-solar-500 mb-0.5">{cat?.title}</p>
          <h3 className="font-semibold text-sm group-hover:text-solar-500 transition-colors">
            {article.title}
          </h3>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Clock className="w-3 h-3" />
            {article.readMinutes} min read
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-solar-500" />
      </Link>
    </motion.div>
  );
}
