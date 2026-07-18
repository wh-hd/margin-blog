import type { JsonLdObject, PostDetail, SiteConfig } from '@/lib/content/types';

export function buildPersonJsonLd(site: SiteConfig): JsonLdObject {
  const person: JsonLdObject = {
    '@type': 'Person',
    '@id': `${site.siteUrl.replace(/\/$/u, '')}/#person`,
    name: site.name,
  };
  if (site.social.length > 0) person.sameAs = site.social.map(({ url }) => url);
  if (site.contact.status === 'confirmed' && site.contact.website) person.url = site.contact.website;
  return person;
}

export function buildWebsiteJsonLd(site: SiteConfig): JsonLdObject {
  return {
    '@type': 'WebSite',
    '@id': `${site.siteUrl.replace(/\/$/u, '')}/#website`,
    url: `${site.siteUrl.replace(/\/$/u, '')}/`,
    name: site.brand,
    description: site.description,
    inLanguage: site.locale,
    publisher: { '@id': `${site.siteUrl.replace(/\/$/u, '')}/#person` },
  };
}

export function buildBlogPostingJsonLd(post: PostDetail, site: SiteConfig, canonical: string): JsonLdObject {
  const object: JsonLdObject = {
    '@type': 'BlogPosting',
    '@id': `${canonical}#article`,
    url: canonical,
    headline: post.title,
    description: post.description,
    datePublished: post.publishDate.toISOString(),
    inLanguage: site.locale,
    articleSection: post.category.name,
    keywords: post.tags.map(({ name }) => name),
    author: { '@id': `${site.siteUrl.replace(/\/$/u, '')}/#person` },
    publisher: { '@id': `${site.siteUrl.replace(/\/$/u, '')}/#person` },
    mainEntityOfPage: canonical,
  };
  if (post.updatedDate) object.dateModified = post.updatedDate.toISOString();
  if (post.cover && typeof post.cover.src === 'object' && post.cover.src && 'src' in post.cover.src) {
    object.image = new URL(String(post.cover.src.src), site.siteUrl).toString();
  }
  return object;
}

export function serializeJsonLd(value: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(value).replace(/</gu, '\\u003c').replace(/>/gu, '\\u003e').replace(/&/gu, '\\u0026');
}
