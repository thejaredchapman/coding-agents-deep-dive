import { describe, expect, it } from 'vitest';
import { Slide } from './deck.model';
import { buildIndex, search } from './search';

const slides: Slide[] = [
  { id: 1, section: 'Intro', title: 'Cover', html: '<h1>Cover</h1>' },
  { id: 2, section: '5. Hooks', title: 'Hook exit codes', html: '<table><tr><td>Exit 2</td><td>Blocks the tool call</td></tr></table>' },
  { id: 3, section: '4. MCP', title: 'Registering an MCP server', html: '<p>Use <code>claude mcp add</code> to register a server. Hooks are unrelated.</p>' },
  { id: 4, section: '9. Codex', title: 'Codex: MCP', html: '<pre><code>codex mcp add context7</code></pre>' },
  { id: 5, section: '3. Skills', title: 'Anatomy of a Skill', html: '<p>A <b>SKILL.md</b> file with frontmatter.</p>' },
];

const index = buildIndex(slides);

describe('buildIndex', () => {
  it('strips tags and keeps text, title and section', () => {
    const e = index.find((x) => x.id === 5)!;
    expect(e.text).toBe('A SKILL.md file with frontmatter.');
    expect(e.title).toBe('Anatomy of a Skill');
    expect(e.section).toBe('3. Skills');
  });
  it('leaves the slide heading out of the body text', () => {
    const [e] = buildIndex([{ id: 1, section: 's', title: 'Hook exit codes', html: '<h2>Hook exit codes</h2><p>Exit 2 blocks.</p>' }]);
    expect(e.text).toBe('Exit 2 blocks.');
  });

  it('decodes entities', () => {
    const [e] = buildIndex([{ id: 1, section: 's', title: 't', html: '<p>a &amp; b &lt;c&gt;</p>' }]);
    expect(e.text).toBe('a & b <c>');
  });
});

describe('search', () => {
  it('returns nothing for an empty or blank query', () => {
    expect(search(index, '')).toEqual([]);
    expect(search(index, '   ')).toEqual([]);
  });

  it('ranks a title match above a body-only match', () => {
    const hits = search(index, 'hooks');
    expect(hits[0].id).toBe(2); // section and title mention hooks
    expect(hits.map((h) => h.id)).toContain(3); // body-only mention
    expect(hits.findIndex((h) => h.id === 2)).toBeLessThan(hits.findIndex((h) => h.id === 3));
  });

  it('requires every word to match somewhere (AND)', () => {
    expect(search(index, 'mcp codex').map((h) => h.id)).toEqual([4]);
    expect(search(index, 'mcp zzzz')).toEqual([]);
  });

  it('is case-insensitive and tolerates regex characters', () => {
    expect(search(index, 'SKILL.md').map((h) => h.id)).toEqual([5]);
    expect(() => search(index, '(*[')).not.toThrow();
    expect(search(index, '(*[')).toEqual([]);
  });

  it('gives a snippet around the first body match', () => {
    const [hit] = search(index, 'blocks');
    expect(hit.id).toBe(2);
    expect(hit.snippet.toLowerCase()).toContain('blocks');
  });

  it('respects the limit', () => {
    expect(search(index, 'a', 2).length).toBeLessThanOrEqual(2);
  });
});
