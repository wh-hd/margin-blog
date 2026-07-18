import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const root = process.cwd();
const postsRoot = path.join(root, 'src/content/posts');
const destination = path.join(root, 'dist/_redirects');

async function listMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? listMarkdown(absolute) : [/\.mdx?$/u.test(entry.name) ? absolute : []];
  }));
  return files.flat();
}

const files = await listMarkdown(postsRoot);
const buildTime = new Date();
const occupied = new Map();
const redirects = [];
for (const file of files) {
  const relative = path.relative(postsRoot, file).replace(/\\/gu, '/').replace(/\.mdx?$/u, '');
  const canonicalPath = `/articles/${relative}/`;
  occupied.set(canonicalPath, `正式文章 ${relative}`);
}
for (const file of files) {
  const relative = path.relative(postsRoot, file).replace(/\\/gu, '/').replace(/\.mdx?$/u, '');
  const source = await readFile(file, 'utf8');
  const frontmatterMatch = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(source);
  if (!frontmatterMatch) throw new Error(`缺少 frontmatter：${file}`);
  const data = YAML.parse(frontmatterMatch[1]);
  const publishDate = new Date(data.publishDate);
  if (data.draft === true || Number.isNaN(publishDate.getTime()) || publishDate > buildTime) continue;
  for (const alias of data.aliases ?? []) {
    const conflict = occupied.get(alias);
    if (conflict) throw new Error(`redirect 冲突：${alias} 已被 ${conflict} 占用`);
    occupied.set(alias, `文章 ${relative} alias`);
    redirects.push(`${alias} /articles/${relative}/ 301`);
  }
}
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, `${redirects.sort().join('\n')}${redirects.length ? '\n' : ''}`, 'utf8');
console.log(`Generated ${redirects.length} redirect(s).`);
