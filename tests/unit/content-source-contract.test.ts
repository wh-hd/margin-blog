import { readFile, readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

const root = resolve(import.meta.dirname, '../..');
const postsRoot = resolve(root, 'src/content/posts');

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : [/\.mdx?$/u.test(entry.name) ? path : []];
  }))).flat();
}

async function frontmatter(file: string): Promise<Record<string, unknown>> {
  const source = await readFile(file, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(source);
  if (!match?.[1]) throw new Error(`Missing frontmatter: ${file}`);
  return YAML.parse(match[1]) as Record<string, unknown>;
}

describe('real content source contract', () => {
  it('provides at least four published posts across one or more categories', async () => {
    const files = await markdownFiles(postsRoot);
    const records = await Promise.all(files.map(async (file) => ({ file, data: await frontmatter(file), body: await readFile(file, 'utf8') })));
    const published = records.filter(({ data }) => data.draft !== true);
    expect(published.length).toBeGreaterThanOrEqual(4);
    expect(new Set(published.map(({ data }) => data.category)).size).toBeGreaterThanOrEqual(1);
    for (const record of published) expect(record.body.trim().length).toBeGreaterThan(0);
  });

  it('uses stable kebab-case slugs and globally unique aliases', async () => {
    const files = await markdownFiles(postsRoot);
    const official = new Set(files.map((file) => `/articles/${relative(postsRoot, file).replace(/\\/gu, '/').replace(/\.mdx?$/u, '')}/`));
    const aliases = new Set<string>();
    for (const file of files) {
      const data = await frontmatter(file);
      for (const alias of (data.aliases ?? []) as string[]) {
        expect(alias).toMatch(/^\/[a-z0-9/-]*\/$/u);
        expect(official.has(alias)).toBe(false);
        expect(aliases.has(alias)).toBe(false);
        aliases.add(alias);
      }
    }
  });

  it('has a draft fixture for production exclusion checks', async () => {
    const files = await markdownFiles(postsRoot);
    const records = await Promise.all(files.map(frontmatter));
    expect(records.some(({ draft }) => draft === true)).toBe(true);
  });
});
