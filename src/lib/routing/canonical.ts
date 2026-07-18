import type { AbsoluteUrl } from '@/lib/content/types';

function withTrailingSlash(pathname: string): string {
  if (pathname === '/') return pathname;
  if (/\.[a-z0-9]+$/i.test(pathname)) return pathname;
  return `${pathname.replace(/\/+$/u, '')}/`;
}

export function normalizeInternalPath(path: string): string {
  const parsed = new URL(path, 'https://internal.invalid');
  return withTrailingSlash(parsed.pathname.replace(/\/{2,}/gu, '/'));
}

export function buildCanonical(path: string, siteUrl: string): AbsoluteUrl {
  const site = new URL(siteUrl);
  const candidate = new URL(path, site);
  if (candidate.origin !== site.origin) {
    throw new Error(`拒绝跨域 canonical 路径：${candidate.origin}`);
  }
  candidate.search = '';
  candidate.hash = '';
  candidate.pathname = withTrailingSlash(candidate.pathname.replace(/\/{2,}/gu, '/'));
  return candidate.toString();
}

export function resolveCanonical(path: string, siteUrl: string, explicit?: string): AbsoluteUrl {
  if (!explicit) return buildCanonical(path, siteUrl);
  const site = new URL(siteUrl);
  const candidate = new URL(explicit);
  if (candidate.origin === site.origin) return buildCanonical(candidate.pathname, siteUrl);
  candidate.search = '';
  candidate.hash = '';
  return candidate.toString();
}
