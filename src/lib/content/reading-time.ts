export interface ReadingTimeResult {
  minutes: number;
  label: string;
  wordUnits: number;
}

const CJK_CHARACTER = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const LATIN_WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---/u, ' ')
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/`[^`]*`/gu, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/[#>*_~|-]+/gu, ' ');
}

export function calculateReadingTime(markdown: string): ReadingTimeResult {
  const text = stripMarkdown(markdown);
  const cjkCount = text.match(CJK_CHARACTER)?.length ?? 0;
  const withoutCjk = text.replace(CJK_CHARACTER, ' ');
  const latinCount = withoutCjk.match(LATIN_WORD)?.length ?? 0;
  const wordUnits = cjkCount + latinCount;
  const minutes = Math.max(1, Math.ceil(cjkCount / 300 + latinCount / 200));

  return { minutes, label: `约 ${minutes} 分钟`, wordUnits };
}
