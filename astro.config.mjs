import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = 'https://example.com'; // 发布前替换为作者确认的正式域名，并同步 site/config.json。

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
