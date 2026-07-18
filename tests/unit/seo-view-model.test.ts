import { describe, expect, it } from 'vitest';
import { buildSeoViewModel } from '@/lib/seo/view-model';
import type { SiteConfig } from '@/lib/content/types';

const site = {
  siteUrl: 'https://example.com', defaultOgImage: '/og/default.svg', locale: 'zh-CN',
} as SiteConfig;

describe('buildSeoViewModel', () => {
  it('uses absolute canonical and social image URLs', () => {
    const seo = buildSeoViewModel({ title: '标题', description: '描述', path: '/about/', site });
    expect(seo.canonical).toBe('https://example.com/about/');
    expect(seo.openGraph.image).toBe('https://example.com/og/default.svg');
    expect(seo.twitter.card).toBe('summary_large_image');
  });
});
