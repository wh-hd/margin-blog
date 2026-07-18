import type { JsonLdObject, SeoViewModel, SiteConfig } from '@/lib/content/types';
import { buildCanonical } from '@/lib/routing/canonical';

interface SeoInput {
  title: string;
  description: string;
  path: string;
  site: SiteConfig;
  type?: 'website' | 'article';
  image?: string;
  robots?: 'index,follow' | 'noindex,follow';
  jsonLd?: JsonLdObject[];
  canonical?: string;
}

export function buildSeoViewModel(input: SeoInput): SeoViewModel {
  const canonical = input.canonical ?? buildCanonical(input.path, input.site.siteUrl);
  const image = new URL(input.image ?? input.site.defaultOgImage, input.site.siteUrl).toString();
  return {
    title: input.title,
    description: input.description,
    canonical,
    openGraph: {
      type: input.type ?? 'website',
      title: input.title,
      description: input.description,
      url: canonical,
      image,
      locale: input.site.locale,
    },
    twitter: { card: 'summary_large_image', title: input.title, description: input.description, image },
    ...(input.robots ? { robots: input.robots } : {}),
    jsonLd: input.jsonLd ?? [],
  };
}
