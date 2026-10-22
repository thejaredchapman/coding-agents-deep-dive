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

import { buildExplorer } from './build-slides.mjs';

const explorerSample = `
# Intro

---

## Claude Code shortcuts (1/2): session

| Group | Shortcut | Action |
|-------|----------|--------|
| **Session** | \`Ctrl+C\` | Interrupt |
| | \`Esc\` \`Esc\` | Clear the draft |
| **Modes** | \`Shift+Tab\` | Cycle modes |

---

## Cursor shortcuts (2/2): editor (macOS)

| Key | Action |
|-----|--------|
| \`Cmd+K\` | Inline edit |

---

## Claude Code commands cheat sheet (1/2)

| Command | Does |
|---------|------|
| \`/init\` | Draft a CLAUDE.md |
| \`/model\`, \`/fast\` | Switch model; toggle fast mode |

---

## Codex shortcuts and commands (partial)

| What | Verified |
|------|----------|
| \`@\` | Mention a file |
| \`/permissions\` | Change sandbox |

---

## Something else

| a | b |
|---|---|
| 1 | 2 |
`;

test('buildExplorer extracts shortcuts with groups carried over blank cells', () => {
  const items = buildExplorer(explorerSample);
  const claude = items.filter((i) => i.tool === 'claude' && i.kind === 'shortcut');
  assert.deepEqual(claude.map((i) => [i.group, i.keys, i.action]), [
    ['Session', 'Ctrl+C', 'Interrupt'],
    ['Session', 'Esc Esc', 'Clear the draft'],
    ['Modes', 'Shift+Tab', 'Cycle modes'],
  ]);
});

test('buildExplorer renders key caps as kbd and escapes HTML', () => {
  const [first] = buildExplorer(explorerSample);
  assert.match(first.keysHtml, /<kbd>Ctrl\+C<\/kbd>/);
  const [esc] = buildExplorer('## Cursor shortcuts\n\n| Key | Action |\n|-|-|\n| `<b>` | x |\n');
  assert.match(esc.keysHtml, /&lt;b&gt;/);
});

test('buildExplorer maps tools from slide titles and handles two-column tables', () => {
  const items = buildExplorer(explorerSample);
  const cursor = items.find((i) => i.tool === 'cursor');
  assert.equal(cursor.keys, 'Cmd+K');
  assert.equal(cursor.group, 'Editor (macOS)');
  assert.equal(cursor.kind, 'shortcut');
});

test('buildExplorer classifies slash commands and splits multi-command cells', () => {
  const items = buildExplorer(explorerSample);
  const cmds = items.filter((i) => i.tool === 'claude' && i.kind === 'command');
  assert.deepEqual(cmds.map((i) => i.keys), ['/init', '/model, /fast']);
});

test('buildExplorer ignores slides that are not shortcut or command tables', () => {
  const items = buildExplorer(explorerSample);
  assert.ok(!items.some((i) => i.action === '2'));
});

test('buildExplorer on the real deck covers all seven tools', () => {
  const deck = readFileSync(new URL('../deck.md', import.meta.url), 'utf8');
  const tools = new Set(buildExplorer(deck).map((i) => i.tool));
  assert.deepEqual([...tools].sort(), ['aider', 'claude', 'codex', 'copilot', 'cursor', 'devin', 'gemini']);
});
