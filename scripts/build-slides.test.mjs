import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDeck } from './build-slides.mjs';

const sample = `---
marp: true
style: |
  section { color: red; }
---

# Intro

---

# 1. First section

---

## Slide A

\`\`\`
---
not a split
\`\`\`

---

## Slide B

text

---

# 2. Second section

---

## 🛠 Exercise 2 — Thing

See \`exercises/02-subagents.md\`
`;

test('skips front matter and splits only on bare --- outside fences', () => {
  const slides = parseDeck(sample);
  assert.equal(slides.length, 6);
  assert.equal(slides[2].title, 'Slide A');
  assert.match(slides[2].html, /not a split/);
});

test('tracks the nearest preceding top-level section', () => {
  const slides = parseDeck(sample);
  assert.equal(slides[0].section, 'Intro');
  assert.equal(slides[2].section, '1. First section');
  assert.equal(slides[3].section, '1. First section');
  assert.equal(slides[5].section, '2. Second section');
});

test('ids are 1-based and sequential', () => {
  const slides = parseDeck(sample);
  assert.deepEqual(slides.map((s) => s.id), [1, 2, 3, 4, 5, 6]);
});

test('renders markdown to HTML', () => {
  const slides = parseDeck('# T\n\n| a | b |\n|---|---|\n| 1 | 2 |\n');
  assert.match(slides[0].html, /<table>/);
});

test('real deck parses to the same slide count the check script reports', () => {
  const deck = readFileSync(new URL('../deck.md', import.meta.url), 'utf8');
  const slides = parseDeck(deck);
  const body = deck.replace(/^---\n[\s\S]*?\n---\n/, '');
  let inFence = false;
  let n = 1;
  for (const line of body.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    else if (!inFence && line.trim() === '---') n++;
  }
  assert.equal(slides.length, n);
});

test('every slide has a non-empty title and html', () => {
  const deck = readFileSync(new URL('../deck.md', import.meta.url), 'utf8');
  for (const s of parseDeck(deck)) {
    assert.ok(s.title.length > 0, `slide ${s.id} has no title`);
    assert.ok(s.html.length > 0, `slide ${s.id} has no html`);
  }
});
