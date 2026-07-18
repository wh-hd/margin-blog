import type { CollectionEntry } from 'astro:content';

export type Slug = string;
export type AbsoluteUrl = string;

export interface TaxonomyRef {
  slug: Slug;
  name: string;
  description: string;
  boundary: string;
}

export interface ImageViewModel {
  src: unknown;
  alt: string;
}

export interface PostSummary {
  slug: Slug;
  href: string;
  title: string;
  description: string;
  publishDate: Date;
  updatedDate?: Date;
  category: TaxonomyRef;
  tags: TaxonomyRef[];
  readingMinutes: number;
  readingTimeLabel: string;
  featured: boolean;
  cover?: ImageViewModel;
}

export interface PostDetail extends PostSummary {
  entry: CollectionEntry<'posts'>;
  canonical?: AbsoluteUrl;
  aliases: string[];
}

export interface TaxonomyCounts {
  categories: Record<Slug, number>;
  tags: Record<Slug, number>;
}

export interface CategorySummary extends TaxonomyRef {
  count: number;
  representative?: PostSummary;
}

export interface TagSummary extends TaxonomyRef {
  count: number;
}

export interface RelatedTag extends TaxonomyRef {
  count: number;
}

export interface ContactConfig {
  status: 'confirmed' | 'private' | 'pending';
  email?: string;
  website?: AbsoluteUrl;
  notice?: string;
}

export interface ContactViewModel {
  text: string;
  href?: string;
}

export interface SiteConfig {
  name: string;
  brand: string;
  positioning: string;
  description: string;
  siteUrl: AbsoluteUrl;
  defaultOgImage: string;
  locale: 'zh-CN';
  social: Array<{ label: string; url: AbsoluteUrl }>;
  contact: ContactConfig;
  currentFocus: string;
  about: {
    intro: string;
    questions: string[];
    principles: string[];
    timeline: Array<{ date: string; title: string; description: string; evidenceUrl?: AbsoluteUrl }>;
    timelineNotice?: string;
    contactBoundary?: string;
  };
}

export interface TaxonomiesConfig {
  categories: TaxonomyRef[];
  tags: TaxonomyRef[];
}

export interface SeoViewModel {
  title: string;
  description: string;
  canonical: AbsoluteUrl;
  openGraph: {
    type: 'website' | 'article';
    title: string;
    description: string;
    url: AbsoluteUrl;
    image: AbsoluteUrl;
    locale: string;
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: AbsoluteUrl;
  };
  robots?: 'index,follow' | 'noindex,follow';
  jsonLd: JsonLdObject[];
}

export type JsonLdObject = Record<string, unknown>;

export interface HomePageModel {
  site: SiteConfig;
  featured: PostSummary[];
  latest: PostSummary[];
  categories: CategorySummary[];
  practiceNotes: PostSummary[];
  seo: SeoViewModel;
}

export interface ArticlesPageModel {
  site: SiteConfig;
  posts: PostSummary[];
  categories: TaxonomyRef[];
  tags: TaxonomyRef[];
  total: number;
  seo: SeoViewModel;
}

export interface ArticlePageModel {
  site: SiteConfig;
  post: PostDetail;
  related: PostSummary[];
  seo: SeoViewModel;
}

export interface CategoriesPageModel {
  site: SiteConfig;
  categories: CategorySummary[];
  seo: SeoViewModel;
}

export interface CategoryPageModel {
  site: SiteConfig;
  category: TaxonomyRef;
  posts: PostSummary[];
  featured?: PostSummary;
  relatedTags: RelatedTag[];
  seo: SeoViewModel;
}

export interface TagPageModel {
  site: SiteConfig;
  tag: TaxonomyRef;
  posts: PostSummary[];
  relatedTags: RelatedTag[];
  seo: SeoViewModel;
}

export interface AboutPageModel {
  site: SiteConfig;
  seo: SeoViewModel;
}
