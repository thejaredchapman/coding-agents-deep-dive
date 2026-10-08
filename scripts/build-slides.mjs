#!/usr/bin/env node
// Turns deck.md (Marp markdown) into app/public/slides.json for the Angular app.
// deck.md stays the single source of truth; nothing here is hand-edited.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Slides whose text we show next to an SVG diagram (rendered by the app).
const DIAGRAMS = [
  [/^What is a subagent\?$/, 'subagents'],
  [/^What are Hooks\?$/, 'hooks'],
  [/^The full picture$/, 'flow'],
  [/^The same five ideas everywhere$/, 'ecosystem'],
  [/^Pick Your Tool: Tick what matters to you \(1\/2\)$/, 'picker'],
];

function stripFences(text) {
  return text.replace(/^```[\s\S]*?^```/gm, '').replace(/^````[\s\S]*?^````/gm, '');
}

function plain(heading) {
  return heading.replace(/`/g, '').replace(/\*\*/g, '').trim();
}

export function splitSlides(markdown) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
  const slides = [];
  let current = [];
  let fence = null;
  for (const line of body.split('\n')) {
    const m = line.match(/^(`{3,})/);
    if (m) {
      if (fence === null) fence = m[1].length;
      else if (m[1].length >= fence) fence = null;
    }
    if (fence === null && line.trim() === '---') {
      slides.push(current.join('\n'));
      current = [];
    } else {
      current.push(line);
    }
  }
  slides.push(current.join('\n'));
  return slides.map((s) => s.trim());
}

export function parseDeck(markdown) {
  const raw = splitSlides(markdown);
  let section = 'Intro';
  return raw.map((md, i) => {
    const visible = stripFences(md);
    const firstLine = visible.split('\n').find((l) => l.trim().length > 0) ?? '';
    if (/^# /.test(firstLine)) {
      const name = plain(firstLine.replace(/^# /, ''));
      // Numbered sections and the closing sections get their own sidebar entry.
      if (/^(\d+\.\s|Putting it together|Keep learning|Questions)/.test(name) || name === 'Intro') section = name;
    }
    const heading = visible.split('\n').find((l) => /^#{1,3} /.test(l)) ?? firstLine;
    const title = plain(heading.replace(/^#{1,3} /, '')) || `Slide ${i + 1}`;
    const slide = { id: i + 1, section, title, html: marked.parse(md, { gfm: true, async: false }) };
    for (const [re, id] of DIAGRAMS) if (re.test(title)) slide.diagram = id;
    return slide;
  });
}

export function checklistFor(exerciseNumber, exercisesDir) {
  if (!existsSync(exercisesDir)) return [];
  const prefix = String(exerciseNumber).padStart(2, '0') + '-';
  const file = readdirSync(exercisesDir).find((f) => f.startsWith(prefix) && f.endsWith('.md'));
  if (!file) return [];
  const text = readFileSync(resolve(exercisesDir, file), 'utf8');
  return [...stripFences(text).matchAll(/^## ((?:Part|Option) [A-Z][^\n]*)$/gm)].map((m) => plain(m[1]));
}


// ---- Shortcut and command explorer data -------------------------------------------------

const EXPLORER_SLIDES = [
  [/^Claude Code (shortcuts|commands)/i, 'claude'],
  [/^Codex shortcuts/i, 'codex'],
  [/^Cursor shortcuts/i, 'cursor'],
  [/^Gemini CLI shortcuts/i, 'gemini'],
];

function splitCells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, '|').trim());
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function keysToHtml(cell) {
  return escapeHtml(cell).replace(/`([^`]+)`/g, '<kbd>$1</kbd>');
}

function plainCell(cell) {
  return cell.replace(/`/g, '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
}

function parseTable(md) {
  const lines = stripFences(md)
    .split('\n')
    .filter((l) => l.trim().startsWith('|'));
  if (lines.length < 3) return null;
  const header = splitCells(lines[0]).map((c) => plainCell(c).toLowerCase());
  const rows = lines.slice(2).map(splitCells);
  return { header, rows };
}

export function buildExplorer(markdown) {
  const items = [];
  for (const md of splitSlides(markdown)) {
    const visible = stripFences(md);
    const headingLine = visible.split('\n').find((l) => /^#{1,3} /.test(l));
    if (!headingLine) continue;
    const title = plain(headingLine.replace(/^#{1,3} /, ''));
    const match = EXPLORER_SLIDES.find(([re]) => re.test(title));
    if (!match) continue;
    const table = parseTable(md);
    if (!table) continue;

    const hasGroup = table.header[0] === 'group';
    const commandTable = table.header[0] === 'command';
    const afterColon = title.includes(':') ? title.slice(title.indexOf(':') + 1).trim() : '';
    const defaultGroup = afterColon ? afterColon[0].toUpperCase() + afterColon.slice(1) : '';

    let group = defaultGroup;
    for (const cells of table.rows) {
      let keysCell;
      let actionCell;
      if (hasGroup) {
        const g = plainCell(cells[0]);
        if (g) group = g;
        [, keysCell, actionCell] = cells;
      } else {
        [keysCell, actionCell] = cells;
      }
      if (!keysCell || !actionCell) continue;
      const keys = plainCell(keysCell);
      if (!keys) continue;
      const isCommand = commandTable || /^(\/|codex )/.test(keys);
      items.push({
        tool: match[1],
        kind: isCommand ? 'command' : 'shortcut',
        group: group || (isCommand ? 'Commands' : 'Shortcuts'),
        keys,
        keysHtml: keysToHtml(keysCell),
        action: plainCell(actionCell),
      });
    }
  }
  return items;
}

function lastUpdated() {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', 'deck.md'], { cwd: root, encoding: 'utf8' }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch {
    /* fall through */
  }
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const deck = readFileSync(resolve(root, 'deck.md'), 'utf8');
  const slides = parseDeck(deck);
  for (const s of slides) {
    const m = s.title.match(/Exercise (\d+)/);
    if (m) s.checklist = checklistFor(Number(m[1]), resolve(root, 'exercises'));
  }
  const out = resolve(root, 'app/public/slides.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({ updated: lastUpdated(), slides }) + '\n');
  const explorer = buildExplorer(deck);
  writeFileSync(resolve(root, 'app/public/explorer.json'), JSON.stringify(explorer) + '\n');
  console.log(`Wrote ${slides.length} slides and ${explorer.length} explorer entries to app/public (updated ${lastUpdated()})`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
