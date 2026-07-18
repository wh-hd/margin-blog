import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

async function readJson(relative: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(resolve(root, relative), 'utf8')) as Record<string, unknown>;
}

describe('content configuration source', () => {
  it('keeps the site URL aligned with Astro site', async () => {
    const site = await readJson('src/content/site/config.json');
    const astroConfig = await readFile(resolve(root, 'astro.config.mjs'), 'utf8');
    expect(astroConfig).toContain(`const site = '${String(site.siteUrl)}'`);
  });

  it('contains 3 to 5 unique categories and unique tags', async () => {
    const config = await readJson('src/content/taxonomies/config.json');
    const categories = config.categories as Array<{ slug: string }>;
    const tags = config.tags as Array<{ slug: string }>;
    expect(categories.length).toBeGreaterThanOrEqual(3);
    expect(categories.length).toBeLessThanOrEqual(5);
    expect(new Set(categories.map(({ slug }) => slug)).size).toBe(categories.length);
    expect(new Set(tags.map(({ slug }) => slug)).size).toBe(tags.length);
  });

  it('marks example identity and focus content explicitly', async () => {
    const site = await readJson('src/content/site/config.json');
    expect(String(site.name)).toContain('内容待确认');
    expect(String(site.currentFocus)).toContain('示例内容');
  });
});
