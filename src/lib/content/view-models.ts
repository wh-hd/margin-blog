import { buildBlogPostingJsonLd, buildPersonJsonLd, buildWebsiteJsonLd } from '@/lib/seo/json-ld';
export { buildContactViewModel } from './contact';
import { buildSeoViewModel } from '@/lib/seo/view-model';
import { resolveCanonical } from '@/lib/routing/canonical';
import {
  getCategoryDirectory,
  getPostBySlug,
  getPublishedPosts,
  getRelatedPosts,
  getRelatedTagsForCategory,
  getRelatedTagsForTag,
  getSiteConfig,
  getTaxonomies,
} from './queries';
import type {
  AboutPageModel,
  ArticlePageModel,
  ArticlesPageModel,
  CategoriesPageModel,
  CategoryPageModel,
  HomePageModel,
  TagPageModel,
} from './types';

const pageTitle = (page: string, brand: string) => `${page}｜${brand}`;

export async function getHomePageModel(): Promise<HomePageModel> {
  const [site, posts, categories] = await Promise.all([getSiteConfig(), getPublishedPosts(), getCategoryDirectory()]);
  const selectedFeatured = posts.filter(({ featured }) => featured).slice(0, 3);
  const featured = selectedFeatured.length > 0 ? selectedFeatured : posts.slice(0, 3);
  const featuredSlugs = new Set(featured.map(({ slug }) => slug));
  const latest = posts.filter(({ slug }) => !featuredSlugs.has(slug)).slice(0, 6);
  const practiceNotes = posts.filter(({ tags }) => tags.some(({ slug }) => ['ai-workflow', 'decision-log', 'content-workflow'].includes(slug))).slice(0, 3);
  return {
    site,
    featured,
    latest,
    categories,
    practiceNotes,
    seo: buildSeoViewModel({
      title: `${site.brand}｜${site.positioning}`,
      description: site.description,
      path: '/',
      site,
      jsonLd: [{ '@context': 'https://schema.org', '@graph': [buildWebsiteJsonLd(site), buildPersonJsonLd(site)] }],
    }),
  };
}

export async function getArticlesPageModel(): Promise<ArticlesPageModel> {
  const [site, posts, taxonomies] = await Promise.all([getSiteConfig(), getPublishedPosts(), getTaxonomies()]);
  return {
    site,
    posts,
    categories: taxonomies.categories,
    tags: taxonomies.tags,
    total: posts.length,
    seo: buildSeoViewModel({ title: pageTitle('全部文章', site.brand), description: '按发布时间浏览关于 AI、产品与独立创作的实践文章。', path: '/articles/', site }),
  };
}

export async function getArticlePageModel(slug: string): Promise<ArticlePageModel | undefined> {
  const [site, post] = await Promise.all([getSiteConfig(), getPostBySlug(slug)]);
  if (!post) return undefined;
  const canonical = resolveCanonical(post.href, site.siteUrl, post.canonical);
  const related = await getRelatedPosts(post, 3);
  const seo = buildSeoViewModel({
    title: pageTitle(post.title, site.brand),
    description: post.description,
    path: post.href,
    site,
    type: 'article',
    canonical,
    jsonLd: [{ '@context': 'https://schema.org', '@graph': [buildBlogPostingJsonLd(post, site, canonical), buildPersonJsonLd(site)] }],
  });
  return { site, post, related, seo };
}

export async function getCategoriesPageModel(): Promise<CategoriesPageModel> {
  const [site, categories] = await Promise.all([getSiteConfig(), getCategoryDirectory()]);
  return {
    site,
    categories,
    seo: buildSeoViewModel({ title: pageTitle('分类', site.brand), description: '用稳定的主题边界整理文章，而不是追逐临时热点。', path: '/categories/', site }),
  };
}

export async function getCategoryPageModel(slug: string): Promise<CategoryPageModel | undefined> {
  const [site, taxonomies, posts, relatedTags] = await Promise.all([
    getSiteConfig(), getTaxonomies(), getPublishedPosts(), getRelatedTagsForCategory(slug),
  ]);
  const category = taxonomies.categories.find((item) => item.slug === slug);
  if (!category) return undefined;
  const matched = posts.filter((post) => post.category.slug === slug);
  const featured = matched.find((post) => post.featured) ?? matched[0];
  return {
    site,
    category,
    posts: matched,
    ...(featured ? { featured } : {}),
    relatedTags,
    seo: buildSeoViewModel({ title: pageTitle(category.name, site.brand), description: category.description, path: `/categories/${slug}/`, site }),
  };
}

export async function getTagPageModel(slug: string): Promise<TagPageModel | undefined> {
  const [site, taxonomies, posts, relatedTags] = await Promise.all([
    getSiteConfig(), getTaxonomies(), getPublishedPosts(), getRelatedTagsForTag(slug),
  ]);
  const tag = taxonomies.tags.find((item) => item.slug === slug);
  if (!tag) return undefined;
  return {
    site,
    tag,
    posts: posts.filter((post) => post.tags.some((item) => item.slug === slug)),
    relatedTags,
    seo: buildSeoViewModel({ title: pageTitle(`# ${tag.name}`, site.brand), description: tag.description, path: `/tags/${slug}/`, site }),
  };
}

export async function getAboutPageModel(): Promise<AboutPageModel> {
  const site = await getSiteConfig();
  return {
    site,
    seo: buildSeoViewModel({
      title: pageTitle('关于侧注', site.brand),
      description: site.about.intro.slice(0, 180),
      path: '/about/',
      site,
      jsonLd: [{ '@context': 'https://schema.org', '@graph': [buildPersonJsonLd(site)] }],
    }),
  };
}

export async function getArticleStaticPaths(): Promise<Array<{ params: { slug: string }; props: { model: ArticlePageModel } }>> {
  const posts = await getPublishedPosts();
  const paths = await Promise.all(posts.map(async ({ slug }) => {
    const model = await getArticlePageModel(slug);
    if (!model) throw new Error(`已发布文章无法生成页面模型：${slug}`);
    return { params: { slug }, props: { model } };
  }));
  return paths;
}

export async function getCategoryStaticPaths(): Promise<Array<{ params: { category: string }; props: { model: CategoryPageModel } }>> {
  const { categories } = await getTaxonomies();
  return Promise.all(categories.map(async ({ slug }) => {
    const model = await getCategoryPageModel(slug);
    if (!model) throw new Error(`白名单分类无法生成页面模型：${slug}`);
    return { params: { category: slug }, props: { model } };
  }));
}

export async function getTagStaticPaths(): Promise<Array<{ params: { tag: string }; props: { model: TagPageModel } }>> {
  const { tags } = await getTaxonomies();
  return Promise.all(tags.map(async ({ slug }) => {
    const model = await getTagPageModel(slug);
    if (!model) throw new Error(`白名单标签无法生成页面模型：${slug}`);
    return { params: { tag: slug }, props: { model } };
  }));
}
