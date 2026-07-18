import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const root = process.cwd();
const dist = path.join(root, 'dist');
const required = ['robots.txt', 'sitemap-index.xml', '_headers', '_redirects'];
for (const item of required) await access(path.join(dist, item));

const postsRoot = path.join(root, 'src/content/posts');
async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? listFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}
const sourceFiles = (await listFiles(postsRoot)).filter((file) => /\.mdx?$/u.test(file));
const excludedSlugs = [];
const buildTime = new Date();
for (const file of sourceFiles) {
  const content = await readFile(file, 'utf8');
  const frontmatterMatch = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(content);
  if (!frontmatterMatch) throw new Error(`缺少 frontmatter：${file}`);
  const data = YAML.parse(frontmatterMatch[1]);
  const publishDate = new Date(data.publishDate);
  if (data.draft === true || publishDate > buildTime) excludedSlugs.push(path.relative(postsRoot, file).replace(/\\/gu, '/').replace(/\.mdx?$/u, ''));
}
for (const slug of excludedSlugs) {
  try {
    await access(path.join(dist, 'articles', slug, 'index.html'));
    throw new Error(`草稿泄漏到构建产物：${slug}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') continue;
    throw error;
  }
}
const sitemapIndex = await readFile(path.join(dist, 'sitemap-index.xml'), 'utf8');
if (!sitemapIndex.includes('<sitemapindex')) throw new Error('sitemap-index.xml 格式异常');
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap:')) throw new Error('robots.txt 缺少 Sitemap 声明');

const sitemapFiles = (await readdir(dist)).filter((file) => /^sitemap-\d+\.xml$/u.test(file));
const sitemapBodies = await Promise.all(sitemapFiles.map((file) => readFile(path.join(dist, file), 'utf8')));
const sitemap = sitemapBodies.join('\n');
for (const slug of excludedSlugs) {
  if (sitemap.includes(`/articles/${slug}/`)) throw new Error(`未发布文章泄漏到 sitemap：${slug}`);
}
if (/\/404(?:\/|\.html)/u.test(sitemap)) throw new Error('404 页面不得进入 sitemap');

const redirects = await readFile(path.join(dist, '_redirects'), 'utf8');
for (const line of redirects.split(/\r?\n/u).filter(Boolean)) {
  const [source, target, status] = line.trim().split(/\s+/u);
  if (!source || !target || status !== '301') throw new Error(`redirect 行格式错误：${line}`);
  if (source === target) throw new Error(`redirect 不得自环：${line}`);
}
console.log(`Build contract passed; verified ${excludedSlugs.length} unpublished exclusion(s), ${sitemapFiles.length} sitemap file(s).`);
