import {
  KB_ARTICLES,
  KB_CATEGORIES,
  type KbArticle,
  type KbCategory,
  type KbCategoryId,
} from '@/content/knowledge-base';

export { KB_ARTICLES, KB_CATEGORIES };
export type { KbArticle, KbCategory, KbCategoryId };

export function getArticleBySlug(slug: string): KbArticle | undefined {
  return KB_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(categoryId: KbCategoryId): KbArticle[] {
  return KB_ARTICLES.filter((a) => a.categoryId === categoryId);
}

export function getFeaturedArticles(): KbArticle[] {
  return KB_ARTICLES.filter((a) => a.featured);
}

export function getCategoryById(id: KbCategoryId) {
  return KB_CATEGORIES.find((c) => c.id === id);
}

export function searchArticles(query: string): KbArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return KB_ARTICLES;

  return KB_ARTICLES.filter((article) => {
    const haystack = [
      article.title,
      article.summary,
      ...article.tags,
      getCategoryById(article.categoryId)?.title ?? '',
      ...article.body
        .filter((b) => b.type === 'p' || b.type === 'h2' || b.type === 'h3')
        .map((b) => ('text' in b ? b.text : '')),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q) || q.split(/\s+/).every((word) => haystack.includes(word));
  });
}

export function getAllArticleSlugs(): string[] {
  return KB_ARTICLES.map((a) => a.slug);
}
