export interface PublicationData {
  draft: boolean;
  publishDate: Date;
}

export function isPostPublished(data: PublicationData, now = new Date()): boolean {
  return !data.draft && data.publishDate.getTime() <= now.getTime();
}
