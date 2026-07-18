import { describe, expect, it } from 'vitest';
import { buildPersonJsonLd, serializeJsonLd } from '@/lib/seo/json-ld';
import type { SiteConfig } from '@/lib/content/types';

const site: SiteConfig = {
  name: '内容待确认：作者姓名', brand: '侧注 MARGIN', positioning: '定位',
  description: '这是用于结构化数据测试的足够长度网站描述内容。', siteUrl: 'https://example.com',
  defaultOgImage: '/og/default.svg', locale: 'zh-CN', social: [],
  contact: { status: 'pending', notice: '内容待确认' }, currentFocus: '示例',
  about: { intro: '这是用于测试的足够长度关于页介绍内容，明确不包含未经确认的信息。', questions: ['问题'], principles: ['原则'], timeline: [] },
};

describe('JSON-LD', () => {
  it('omits pending contact data from Person', () => {
    expect(buildPersonJsonLd(site)).not.toHaveProperty('email');
    expect(buildPersonJsonLd(site)).not.toHaveProperty('url');
  });

  it('escapes markup-sensitive characters', () => {
    expect(serializeJsonLd({ value: '</script>&' })).not.toContain('</script>');
  });
});
