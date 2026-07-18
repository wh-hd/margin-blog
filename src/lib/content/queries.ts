import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { isPostPublished } from './publication';
import { calculateReadingTime } from './reading-time';
import type {
  CategorySummary,
  LinkItem,
  PostDetail,
  PostSummary,
  RelatedTag,
  SiteConfig,
  TaxonomiesConfig,
  TaxonomyCounts,
  TaxonomyRef,
} from './types';

let validatedSnapshot: Promise<{
  posts: CollectionEntry<'posts'>[];
  site: SiteConfig;
  taxonomies: TaxonomiesConfig;
}> | undefined;

function comparePosts(left: CollectionEntry<'posts'>, right: CollectionEntry<'posts'>): number {
  return right.data.publishDate.getTime() - left.data.publishDate.getTime() || left.id.localeCompare(right.id, 'en');
}

function normalizeSlug(id: string): string {
  return id.replace(/\.(md|mdx)$/u, '').replace(/\\/gu, '/');
}

function assertCollectionIntegrity(
  posts: CollectionEntry<'posts'>[],
  siteEntries: CollectionEntry<'site'>[],
  taxonomyEntries: CollectionEntry<'taxonomies'>[],
): { site: SiteConfig; taxonomies: TaxonomiesConfig } {
  if (siteEntries.length !== 1) throw new Error(`site 集合必须且只能有 1 项，当前为 ${siteEntries.length} 项`);
  if (taxonomyEntries.length !== 1) throw new Error(`taxonomies 集合必须且只能有 1 项，当前为 ${taxonomyEntries.length} 项`);

  const site = siteEntries[0]!.data as SiteConfig;
  const taxonomies = taxonomyEntries[0]!.data as TaxonomiesConfig;
  const categorySlugs = new Set(taxonomies.categories.map(({ slug }) => slug));
  const tagSlugs = new Set(taxonomies.tags.map(({ slug }) => slug));
  const officialSlugs = new Set<string>();
  const occupiedPaths = new Map<string, string>();

  for (const post of posts) {
    const slug = normalizeSlug(post.id);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/u.test(slug)) {
      throw new Error(`文章 slug 必须每段为 kebab-case：${slug}`);
    }
    if (officialSlugs.has(slug)) throw new Error(`文章 slug 重复：${slug}`);
    officialSlugs.add(slug);
    occupiedPaths.set(`/articles/${slug}/`, `正式 slug ${slug}`);
    if (!categorySlugs.has(post.data.category)) throw new Error(`文章 ${slug} 引用了未知分类：${post.data.category}`);
    for (const tag of post.data.tags) {
      if (!tagSlugs.has(tag)) throw new Error(`文章 ${slug} 引用了未知标签：${tag}`);
    }
  }

  for (const post of posts) {
    const slug = normalizeSlug(post.id);
    for (const alias of post.data.aliases) {
      const conflict = occupiedPaths.get(alias);
      if (conflict) throw new Error(`文章 ${slug} 的 alias ${alias} 与 ${conflict} 冲突`);
      occupiedPaths.set(alias, `文章 ${slug} 的 alias`);
    }
  }

  return { site, taxonomies };
}

async function getSnapshot() {
  validatedSnapshot ??= Promise.all([
    getCollection('posts'),
    getCollection('site'),
    getCollection('taxonomies'),
  ]).then(([posts, siteEntries, taxonomyEntries]) => {
    const { site, taxonomies } = assertCollectionIntegrity(posts, siteEntries, taxonomyEntries);
    return { posts, site, taxonomies };
  });
  return validatedSnapshot;
}

export function resetContentCacheForTests(): void {
  validatedSnapshot = undefined;
}

function taxonomyMap(items: TaxonomyRef[]): Map<string, TaxonomyRef> {
  return new Map(items.map((item) => [item.slug, item]));
}

async function toPostSummary(entry: CollectionEntry<'posts'>, taxonomies: TaxonomiesConfig): Promise<PostSummary> {
  const categories = taxonomyMap(taxonomies.categories);
  const tags = taxonomyMap(taxonomies.tags);
  const slug = normalizeSlug(entry.id);
  const reading = calculateReadingTime(entry.body ?? '');
  const category = categories.get(entry.data.category);
  if (!category) throw new Error(`文章 ${slug} 的分类无法解析`);

  return {
    slug,
    href: `/articles/${slug}/`,
    title: entry.data.title,
    description: entry.data.description,
    publishDate: entry.data.publishDate,
    ...(entry.data.updatedDate ? { updatedDate: entry.data.updatedDate } : {}),
    category,
    tags: entry.data.tags.map((tag) => {
      const item = tags.get(tag);
      if (!item) throw new Error(`文章 ${slug} 的标签 ${tag} 无法解析`);
      return item;
    }),
    readingMinutes: reading.minutes,
    readingTimeLabel: reading.label,
    featured: entry.data.featured,
    ...(entry.data.cover ? { cover: { src: entry.data.cover.src, alt: entry.data.cover.alt } } : {}),
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return (await getSnapshot()).site;
}

export async function getTaxonomies(): Promise<TaxonomiesConfig> {
  return (await getSnapshot()).taxonomies;
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const { posts, taxonomies } = await getSnapshot();
  const now = new Date();
  return Promise.all(posts.filter(({ data }) => isPostPublished(data, now)).sort(comparePosts).map((entry) => toPostSummary(entry, taxonomies)));
}

export async function getPostBySlug(slug: string): Promise<PostDetail | undefined> {
  const normalized = slug.replace(/^\/+|\/+$/gu, '');
  const { posts, taxonomies } = await getSnapshot();
  const now = new Date();
  const entry = posts.find((post) => isPostPublished(post.data, now) && normalizeSlug(post.id) === normalized);
  if (!entry) return undefined;
  const summary = await toPostSummary(entry, taxonomies);
  return {
    ...summary,
    entry,
    ...(entry.data.canonical ? { canonical: entry.data.canonical } : {}),
    aliases: [...entry.data.aliases],
  };
}

export async function getPostsByCategory(slug: string): Promise<PostSummary[]> {
  return (await getPublishedPosts()).filter(({ category }) => category.slug === slug);
}

export async function getPostsByTag(slug: string): Promise<PostSummary[]> {
  return (await getPublishedPosts()).filter(({ tags }) => tags.some((tag) => tag.slug === slug));
}

export async function getTaxonomyCounts(): Promise<TaxonomyCounts> {
  const { categories, tags } = await getTaxonomies();
  const posts = await getPublishedPosts();
  const counts: TaxonomyCounts = {
    categories: Object.fromEntries(categories.map(({ slug }) => [slug, 0])),
    tags: Object.fromEntries(tags.map(({ slug }) => [slug, 0])),
  };
  for (const post of posts) {
    counts.categories[post.category.slug] = (counts.categories[post.category.slug] ?? 0) + 1;
    for (const tag of post.tags) counts.tags[tag.slug] = (counts.tags[tag.slug] ?? 0) + 1;
  }
  return counts;
}

export async function getCategoryDirectory(): Promise<CategorySummary[]> {
  const taxonomies = await getTaxonomies();
  const posts = await getPublishedPosts();
  const counts = await getTaxonomyCounts();
  return taxonomies.categories.map((category) => {
    const representative = posts.find((post) => post.category.slug === category.slug && post.featured)
      ?? posts.find((post) => post.category.slug === category.slug);
    return { ...category, count: counts.categories[category.slug] ?? 0, ...(representative ? { representative } : {}) };
  });
}

export async function getRelatedPosts(post: PostSummary, limit = 3): Promise<PostSummary[]> {
  if (!Number.isInteger(limit) || limit < 0) throw new Error('related limit 必须为非负整数');
  const tagSet = new Set(post.tags.map(({ slug }) => slug));
  const candidates = (await getPublishedPosts())
    .filter(({ slug }) => slug !== post.slug)
    .map((candidate) => ({
      candidate,
      sharedTags: candidate.tags.filter(({ slug }) => tagSet.has(slug)).length,
      sameCategory: candidate.category.slug === post.category.slug,
    }))
    .filter(({ sharedTags, sameCategory }) => sharedTags > 0 || sameCategory)
    .sort((left, right) =>
      right.sharedTags - left.sharedTags
      || Number(right.sameCategory) - Number(left.sameCategory)
      || right.candidate.publishDate.getTime() - left.candidate.publishDate.getTime()
      || left.candidate.slug.localeCompare(right.candidate.slug, 'en'));
  return candidates.slice(0, limit).map(({ candidate }) => candidate);
}

export async function getRelatedTagsForCategory(categorySlug: string, limit = 6): Promise<RelatedTag[]> {
  const { tags } = await getTaxonomies();
  const posts = await getPostsByCategory(categorySlug);
  return tags.map((tag) => ({ ...tag, count: posts.filter((post) => post.tags.some(({ slug }) => slug === tag.slug)).length }))
    .filter(({ count }) => count > 0)
    .sort((left, right) => right.count - left.count || left.slug.localeCompare(right.slug, 'en'))
    .slice(0, limit);
}

export async function getRelatedTagsForTag(tagSlug: string, limit = 6): Promise<RelatedTag[]> {
  const { tags } = await getTaxonomies();
  const posts = await getPostsByTag(tagSlug);
  return tags.filter(({ slug }) => slug !== tagSlug)
    .map((tag) => ({ ...tag, count: posts.filter((post) => post.tags.some(({ slug }) => slug === tag.slug)).length }))
    .filter(({ count }) => count > 0)
    .sort((left, right) => right.count - left.count || left.slug.localeCompare(right.slug, 'en'))
    .slice(0, limit);
}

export async function getLinks(): Promise<LinkItem[]> {
  const entries = await getCollection('links');
  return entries
    .map((entry) => ({
      name: entry.data.name,
      url: entry.data.url,
      ...(entry.data.description ? { description: entry.data.description } : {}),
      ...(entry.data.avatar ? { avatar: entry.data.avatar } : {}),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh'));
}

export async function getPublishedSayEntries(): Promise<CollectionEntry<'says'>[]> {
  const entries = await getCollection('says');
  const now = new Date();
  return entries
    .filter(({ data }) => isPostPublished(data, now))
    .sort((left, right) => right.data.publishDate.getTime() - left.data.publishDate.getTime());
}

export async function getPublishedLogEntries(): Promise<CollectionEntry<'logs'>[]> {
  const entries = await getCollection('logs');
  const now = new Date();
  return entries
    .filter(({ data }) => isPostPublished(data, now))
    .sort((left, right) => right.data.publishDate.getTime() - left.data.publishDate.getTime());
}
