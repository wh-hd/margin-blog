import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '必须为小写 ASCII kebab-case');
const absoluteHttpUrl = z.string().url().refine((value) => /^https?:\/\//.test(value), '必须为 HTTP(S) 绝对 URL');
const meaningfulText = (min: number, max: number) => z.string().trim().min(min).max(max);

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) => z.object({
    title: meaningfulText(1, 80),
    description: meaningfulText(40, 180),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: slug,
    tags: z.array(slug).min(1).max(5).refine((items) => new Set(items).size === items.length, '标签不得重复'),
    cover: z.object({ src: image(), alt: meaningfulText(1, 160) }).optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    canonical: absoluteHttpUrl.optional(),
    aliases: z.array(z.string().regex(/^\/[a-z0-9/-]*\/$/, 'alias 必须为小写站内绝对路径并带尾斜杠')).default([]),
  }).superRefine((data, context) => {
    if (data.updatedDate && data.updatedDate < data.publishDate) {
      context.addIssue({ code: 'custom', path: ['updatedDate'], message: 'updatedDate 不得早于 publishDate' });
    }
  }),
});

const contactSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('confirmed'), email: z.string().email().optional(), website: absoluteHttpUrl.optional() })
    .refine((value) => Boolean(value.email || value.website), 'confirmed 联系方式至少提供 email 或 website'),
  z.object({ status: z.literal('private') }),
  z.object({ status: z.literal('pending'), notice: meaningfulText(1, 120) }),
]);

const site = defineCollection({
  loader: glob({ base: './src/content/site', pattern: 'config.json' }),
  schema: z.object({
    name: meaningfulText(1, 80),
    brand: meaningfulText(1, 80),
    positioning: meaningfulText(1, 120),
    description: meaningfulText(40, 180),
    siteUrl: absoluteHttpUrl,
    defaultOgImage: z.string().regex(/^\/[a-z0-9/_.-]+$/),
    locale: z.literal('zh-CN'),
    social: z.array(z.object({ label: meaningfulText(1, 40), url: absoluteHttpUrl })).default([]),
    contact: contactSchema,
    currentFocus: meaningfulText(1, 240),
    about: z.object({
      intro: meaningfulText(40, 500),
      questions: z.array(meaningfulText(1, 180)).min(1).max(8),
      principles: z.array(meaningfulText(1, 180)).min(1).max(8),
      timeline: z.array(z.object({ date: meaningfulText(1, 40), title: meaningfulText(1, 100), description: meaningfulText(1, 300), evidenceUrl: absoluteHttpUrl.optional() })).default([]),
      timelineNotice: meaningfulText(1, 160).optional(),
      contactBoundary: meaningfulText(1, 240).optional(),
    }),
  }),
});

const taxonomyItem = z.object({
  slug,
  name: meaningfulText(1, 40),
  description: meaningfulText(1, 180),
  boundary: meaningfulText(1, 240),
});

const taxonomies = defineCollection({
  loader: glob({ base: './src/content/taxonomies', pattern: 'config.json' }),
  schema: z.object({
    categories: z.array(taxonomyItem).min(3).max(5).refine((items) => new Set(items.map(({ slug: value }) => value)).size === items.length, '分类 slug 不得重复'),
    tags: z.array(taxonomyItem).min(1).refine((items) => new Set(items.map(({ slug: value }) => value)).size === items.length, '标签 slug 不得重复'),
  }),
});

export const collections = { posts, site, taxonomies };
