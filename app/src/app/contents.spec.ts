import { describe, expect, it } from 'vitest';
import { buildContents, filterContents } from './contents';
import { Slide } from './deck.model';

const mk = (section: string, titles: string[]): Slide[] => titles.map((title, i) => ({ id: 0, section, title, html: '' }));

const slides: Slide[] = [
  ...mk('Intro', ['Cover']),
  ...mk('3. Skills', ['What is a skill?', 'Skill anatomy']),
  ...mk('9. Codex', ['Codex: install', 'Codex: permissions']),
  ...mk('12. Choosing and using any tool', ['12. Choosing', 'Pick Your Tool: Step 0', 'Pick Your Tool: Rubric (1/2)', 'Safeguards: Secrets', 'Safeguards: Blast radius', 'Responsible: Risks']),
  ...mk('14. More assistants', ['Aider: What it is']),
  ...mk('Questions?', ['Questions?']),
  ...mk('99. Odd', ['Odd one']),
].map((s, i) => ({ ...s, id: i + 1 }));

describe('buildContents', () => {
  const groups = buildContents(slides);
  it('groups sections by topic, in the deck order, with unknown ones last', () => {
    expect(groups.map((g) => g.name)).toEqual(['Start here', 'AI coding assistants guide', 'Compare the agents', 'The five extension points', 'Wrap up', 'More']);
    expect(groups[1].sections.map((s) => s.name)).toEqual(['12. Choosing and using any tool', '14. More assistants']);
  });
  it('lists one entry per slide in ordinary sections', () => {
    const skills = groups[3].sections[0];
    expect(skills.items.map((i) => i.label)).toEqual(['What is a skill?', 'Skill anatomy']);
  });
  it('does not turn one repeated prefix into a chapter', () => {
    expect(groups[2].sections[0].items.map((i) => i.label)).toEqual(['Codex: install', 'Codex: permissions']);
  });
  it('merges consecutive slides of the same chapter and keeps the first slide index', () => {
    const items = groups[1].sections[0].items;
    expect(items.map((i) => [i.label, i.count])).toEqual([['12. Choosing', 1], ['Pick Your Tool', 2], ['Safeguards', 2], ['Responsible', 1]]);
    expect(items[1].index).toBe(slides.findIndex((s) => s.title === 'Pick Your Tool: Step 0'));
  });
});

describe('filterContents', () => {
  const groups = buildContents(slides);
  it('returns everything for an empty query', () => expect(filterContents(groups, '  ')).toBe(groups));
  it('keeps matching entries and drops empty sections and groups', () => {
    const r = filterContents(groups, 'blast');
    expect(r.map((g) => g.name)).toEqual(['AI coding assistants guide']);
    expect(r[0].sections[0].items.map((i) => i.label)).toEqual(['Safeguards']);
  });
  it('matches a section or group name and keeps all its entries', () => {
    expect(filterContents(groups, 'skills')[0].sections[0].items.length).toBe(2);
    expect(filterContents(groups, 'compare')[0].sections.length).toBe(1);
  });
  it('requires every word', () => expect(filterContents(groups, 'skill zzz')).toEqual([]));
});
