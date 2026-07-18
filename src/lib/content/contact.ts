import type { ContactViewModel, SiteConfig } from './types';

export function buildContactViewModel(site: SiteConfig): ContactViewModel {
  if (site.contact.status === 'private') {
    return { text: '目前不公开提供直接联系方式。' };
  }

  if (site.contact.status === 'pending') {
    return { text: site.contact.notice ?? '公开联系方式待作者确认。' };
  }

  const href = site.contact.email
    ? `mailto:${site.contact.email}`
    : site.contact.website;

  return {
    text: site.about.contactBoundary ?? '可通过以下方式联系作者。',
    ...(href ? { href } : {}),
  };
}
