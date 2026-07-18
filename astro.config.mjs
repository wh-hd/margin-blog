import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = 'https://margin-blog.pages.dev'; // 当前生产地址为 Cloudflare Pages 子域；购买自定义域名后替换并重建。

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !/\/404(?:\/|\.html\/?$)/u.test(new globalThis.URL(page).pathname),
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
  build: {
    format: 'directory',
  },
  vite: {
    build: { sourcemap: false },
  },
});
