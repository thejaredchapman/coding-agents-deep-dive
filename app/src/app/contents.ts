import { Slide } from './deck.model';

export interface ContentsItem {
  label: string;
  /** Index (0-based) of the first slide of this entry. */
  index: number;
  count: number;
  /** Every slide title in this entry, so a search finds a topic inside a chapter. */
  titles: string;
}

export interface ContentsSection {
  name: string;
  firstIndex: number;
  count: number;
  items: ContentsItem[];
}

export interface ContentsGroup {
  name: string;
  blurb: string;
  sections: ContentsSection[];
}

/** How sections are grouped, by section number (or by name for the unnumbered ones). Anything else lands in "More". */
const GROUPS: { name: string; blurb: string; keys: (number | string)[] }[] = [
  { name: 'Start here', blurb: 'What this is', keys: ['Intro'] },
  { name: 'AI coding assistants guide', blurb: 'Choose a tool, use it safely, seven profiles', keys: [1, 2] },
  { name: 'Compare the agents', blurb: 'Seven tools side by side', keys: [3] },
  { name: 'The five extension points', blurb: 'The idea in every tool, with an exercise each', keys: [4, 5, 6, 7, 8] },
  { name: 'Aider', blurb: 'In depth, ecosystem and field guide', keys: [9, 10, 11] },
  { name: 'Claude Code', blurb: 'In depth, ecosystem, shortcuts and field guide', keys: [12, 13, 14, 15] },
  { name: 'Codex', blurb: 'In depth, ecosystem and field guide', keys: [16, 17, 18] },
  { name: 'Cursor', blurb: 'In depth, ecosystem and field guide', keys: [19, 20, 21] },
  { name: 'Devin Desktop (Windsurf)', blurb: 'In depth, ecosystem and field guide', keys: [22, 23, 24] },
  { name: 'Gemini CLI', blurb: 'In depth, ecosystem and field guide', keys: [25, 26, 27] },
  { name: 'GitHub Copilot', blurb: 'In depth, ecosystem and field guide', keys: [28, 29, 30] },
  { name: 'Wrap up', blurb: 'Putting it together and where to learn more', keys: ['Putting it together', 'Keep learning', 'Questions?'] },
];

function keyOf(sectionName: string): number | string {
  const m = /^(\d+)\.\s/.exec(sectionName);
  return m ? Number(m[1]) : sectionName;
}

const prefixOf = (title: string): string | null => {
  const i = title.indexOf(': ');
  return i > 0 ? title.slice(0, i) : null;
};

/** Entries inside a section: chapters when slide titles read "Chapter: topic" across several chapters, otherwise one entry per slide. */
function itemsFor(slides: Slide[], firstIndex: number): ContentsItem[] {
  const prefixes = new Set(slides.map((s) => prefixOf(s.title)).filter((p): p is string => p !== null));
  const chaptered = prefixes.size >= 3;
  const items: ContentsItem[] = [];
  slides.forEach((slide, i) => {
    const prefix = chaptered ? prefixOf(slide.title) : null;
    const last = items[items.length - 1];
    if (prefix && last && last.label === prefix) {
      last.count++;
      last.titles += ` ${slide.title}`;
    } else items.push({ label: prefix ?? slide.title, index: firstIndex + i, count: 1, titles: slide.title });
  });
  return items;
}

export function buildContents(slides: Slide[]): ContentsGroup[] {
  const sections: ContentsSection[] = [];
  slides.forEach((slide, i) => {
    const last = sections[sections.length - 1];
    if (last && last.name === slide.section) last.count++;
    else sections.push({ name: slide.section, firstIndex: i, count: 1, items: [] });
  });
  for (const s of sections) s.items = itemsFor(slides.slice(s.firstIndex, s.firstIndex + s.count), s.firstIndex);

  const groups: ContentsGroup[] = GROUPS.map((g) => ({
    name: g.name,
    blurb: g.blurb,
    sections: g.keys.flatMap((k) => sections.filter((s) => keyOf(s.name) === k)),
  }));
  const known = new Set(groups.flatMap((g) => g.sections.map((s) => s.name)));
  const rest = sections.filter((s) => !known.has(s.name));
  if (rest.length) groups.push({ name: 'More', blurb: '', sections: rest });
  return groups.filter((g) => g.sections.length > 0);
}

/** Keep only what matches every word of the query, in a section name, a group name or an entry label. */
export function filterContents(groups: ContentsGroup[], query: string): ContentsGroup[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return groups;
  const hit = (text: string) => words.every((w) => text.toLowerCase().includes(w));
  const out: ContentsGroup[] = [];
  for (const g of groups) {
    const sections: ContentsSection[] = [];
    for (const s of g.sections) {
      if (hit(`${g.name} ${s.name}`)) sections.push(s);
      else {
        const items = s.items.filter((it) => hit(`${s.name} ${it.label} ${it.titles}`));
        if (items.length) sections.push({ ...s, items });
      }
    }
    if (sections.length) out.push({ ...g, sections });
  }
  return out;
}
