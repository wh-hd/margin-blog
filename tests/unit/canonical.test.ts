import { describe, expect, it } from 'vitest';
import { buildCanonical, normalizeInternalPath, resolveCanonical } from '@/lib/routing/canonical';

describe('canonical routing', () => {
  it('removes query/hash and applies trailing slash', () => {
    expect(buildCanonical('/articles/demo?tag=x#part', 'https://example.com')).toBe('https://example.com/articles/demo/');
  });

  it('rejects an external path candidate', () => {
    expect(() => buildCanonical('https://evil.example/x', 'https://example.com')).toThrow('拒绝跨域');
  });

  it('allows an explicit external canonical without query/hash', () => {
    expect(resolveCanonical('/articles/demo/', 'https://example.com', 'https://origin.example/post?q=1#x')).toBe('https://origin.example/post');
  });

  it('normalizes repeated separators', () => {
    expect(normalizeInternalPath('/articles//demo?q=1')).toBe('/articles/demo/');
  });
});
