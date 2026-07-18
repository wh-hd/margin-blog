import { describe, expect, it } from 'vitest';
import { isPostPublished } from '@/lib/content/publication';

describe('publication rules', () => {
  const now = new Date('2026-07-17T00:00:00.000Z');

  it('publishes non-draft content whose date has arrived', () => {
    expect(isPostPublished({ draft: false, publishDate: new Date('2026-07-16T00:00:00.000Z') }, now)).toBe(true);
  });

  it('excludes drafts and future-dated content', () => {
    expect(isPostPublished({ draft: true, publishDate: new Date('2026-07-16T00:00:00.000Z') }, now)).toBe(false);
    expect(isPostPublished({ draft: false, publishDate: new Date('2026-07-18T00:00:00.000Z') }, now)).toBe(false);
  });
});
