import { describe, expect, it } from 'vitest';
import { buildContactViewModel } from '@/lib/content/contact';
import type { SiteConfig } from '@/lib/content/types';

const base = {
  name: '作者',
  brand: '侧注 MARGIN',
  positioning: '定位',
  description: '这是一个用于测试联系信息视图模型的足够长度网站描述。',
  siteUrl: 'https://example.com',
  defaultOgImage: '/og/default.svg',
  locale: 'zh-CN',
  social: [],
  currentFocus: '当前关注',
  about: {
    intro: '这是一个用于测试联系信息视图模型的足够长度关于页介绍。',
    questions: ['问题'],
    principles: ['原则'],
    timeline: [],
    contactBoundary: '欢迎围绕文章主题交流。',
  },
} satisfies Omit<SiteConfig, 'contact'>;

describe('contact view model', () => {
  it('keeps pending and private states explicit', () => {
    expect(buildContactViewModel({ ...base, contact: { status: 'pending', notice: '联系方式待确认。' } })).toEqual({ text: '联系方式待确认。' });
    expect(buildContactViewModel({ ...base, contact: { status: 'private' } })).toEqual({ text: '目前不公开提供直接联系方式。' });
  });

  it('creates a mail link for confirmed email', () => {
    expect(buildContactViewModel({ ...base, contact: { status: 'confirmed', email: 'author@example.com' } })).toEqual({
      text: '欢迎围绕文章主题交流。',
      href: 'mailto:author@example.com',
    });
  });
});
