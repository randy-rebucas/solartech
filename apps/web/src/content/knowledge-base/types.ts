export type KbCategoryId =
  | 'getting-started'
  | 'systems-monitoring'
  | 'quotations'
  | 'devices-iot'
  | 'operations'
  | 'billing'
  | 'account';

export type KbBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'callout'; variant: 'tip' | 'warning' | 'info'; title?: string; text: string };

export interface KbCategory {
  id: KbCategoryId;
  title: string;
  description: string;
  icon: string;
}

export interface KbArticle {
  slug: string;
  title: string;
  summary: string;
  categoryId: KbCategoryId;
  tags: string[];
  readMinutes: number;
  updatedAt: string;
  featured?: boolean;
  body: KbBlock[];
}
