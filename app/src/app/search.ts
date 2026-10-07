import { Slide } from './deck.model';

export interface IndexEntry {
  id: number;
  title: string;
  section: string;
  text: string;
  lower: { title: string; section: string; text: string };
}

export interface Hit {
  id: number;
  title: string;
  section: string;
  snippet: string;
  score: number;
}

export function buildIndex(slides: Slide[]): IndexEntry[] {
  const parser = new DOMParser();
  return slides.map((s) => {
    const body = parser.parseFromString(s.html, 'text/html').body;
    body.querySelector('h1, h2, h3')?.remove(); // the title is indexed separately
    const text = (body.textContent ?? '').replace(/\s+/g, ' ').trim();
    return {
      id: s.id,
      title: s.title,
      section: s.section,
      text,
      lower: { title: s.title.toLowerCase(), section: s.section.toLowerCase(), text: text.toLowerCase() },
    };
  });
}

/** Every word must appear in the title, section or body. Title matches count most. */
export function search(index: IndexEntry[], query: string, limit = 12): Hit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const hits: Hit[] = [];
  for (const entry of index) {
    let score = 0;
    let ok = true;
    for (const w of words) {
      const inTitle = entry.lower.title.includes(w);
      const inSection = entry.lower.section.includes(w);
      const bodyCount = countOccurrences(entry.lower.text, w);
      if (!inTitle && !inSection && bodyCount === 0) {
        ok = false;
        break;
      }
      if (inTitle) score += entry.lower.title.startsWith(w) || entry.lower.title.includes(` ${w}`) ? 12 : 8;
      if (inSection) score += 3;
      score += Math.min(bodyCount, 5);
    }
    if (ok) hits.push({ id: entry.id, title: entry.title, section: entry.section, snippet: snippet(entry, words), score });
  }
  return hits.sort((a, b) => b.score - a.score || a.id - b.id).slice(0, limit);
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return count;
    count++;
    from = at + needle.length;
  }
}

function snippet(entry: IndexEntry, words: string[]): string {
  const at = words.map((w) => entry.lower.text.indexOf(w)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (at === undefined) return entry.text.slice(0, 110);
  const start = Math.max(0, at - 40);
  const end = Math.min(entry.text.length, at + 80);
  return `${start > 0 ? '…' : ''}${entry.text.slice(start, end)}${end < entry.text.length ? '…' : ''}`;
}
