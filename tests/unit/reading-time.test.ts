import { describe, expect, it } from 'vitest';
import { calculateReadingTime, stripMarkdown } from '@/lib/content/reading-time';

describe('calculateReadingTime', () => {
  it('at least returns one minute', () => {
    expect(calculateReadingTime('短文')).toMatchObject({ minutes: 1, label: '约 1 分钟' });
  });

  it('counts mixed Chinese and Latin deterministically', () => {
    const result = calculateReadingTime(`${'中'.repeat(300)} ${'word '.repeat(200)}`);
    expect(result.minutes).toBe(2);
    expect(result.wordUnits).toBe(500);
  });

  it('strips code blocks and markdown structure', () => {
    expect(stripMarkdown('# 标题\n```ts\nconst ignored = true;\n```\n[正文](https://example.com)')).not.toContain('ignored');
  });
});
