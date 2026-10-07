#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';

const deck = readFileSync('deck.md', 'utf8');
const readme = readFileSync('README.md', 'utf8');
const exercises = readdirSync('exercises')
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ name: `exercises/${f}`, text: readFileSync(`exercises/${f}`, 'utf8') }));
const all = [{ name: 'deck.md', text: deck }, ...exercises];

const BANNED = ['{{args}}', 'write_file', 'claude-sonnet-4-6', '~/.claude/mcp.json'];
const REQUIRED = [
  ['deck.md', 'SKILL.md'], ['deck.md', '$ARGUMENTS'],
  ['deck.md', 'matcher'], ['deck.md', 'transcript_path'],
  ['deck.md', 'SessionStart'], ['deck.md', 'UserPromptSubmit'],
  ['deck.md', '.claude/agents'], ['deck.md', 'claude mcp add'],
  ['deck.md', 'claude-sonnet-5-5'],
  ['deck.md', 'Claude Tag'], ['deck.md', 'Cowork'],
  ['deck.md', 'Remote Control'], ['deck.md', 'Agent SDK'],
  ['deck.md', 'Managed Agents'], ['deck.md', 'plugin'],
  ['deck.md', 'headless'], ['deck.md', 'academy.claude.com'],
  ['deck.md', 'Codex'], ['deck.md', 'Cursor'],
  ['deck.md', 'AGENTS.md'], ['deck.md', /compared as of/i],
  ['deck.md', 'Gemini CLI'], ['deck.md', 'GEMINI.md'],
  ['deck.md', 'Claude Code shortcuts'], ['deck.md', 'Codex shortcuts'],
  ['deck.md', 'Cursor shortcuts'], ['deck.md', 'Gemini CLI shortcuts'],
];

const failures = [];

// The cross-tool sections legitimately mention other tools' names and placeholders
// (for example Gemini CLI's {{args}} and write_file), so scan the rest of the deck.
function withoutCrossTool(text) {
  const start = text.indexOf('# 7. Four coding agents');
  const end = text.indexOf('# Putting it together');
  return start >= 0 && end > start ? text.slice(0, start) + text.slice(end) : text;
}
for (const { name, text } of all) {
  const scanned = name === 'deck.md' ? withoutCrossTool(text) : text;
  for (const b of BANNED) if (scanned.includes(b)) failures.push(`${name} contains banned string: ${b}`);
}
for (const [file, s] of REQUIRED) {
  const doc = all.find((d) => d.name === file);
  const found = s instanceof RegExp ? s.test(doc.text) : doc.text.includes(s);
  if (!found) failures.push(`${file} is missing required string: ${s}`);
}

function countSlides(md) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  let inFence = false;
  let n = 1;
  for (const line of body.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    else if (!inFence && line.trim() === '---') n++;
  }
  return n;
}
const slides = countSlides(deck);
const claimed = readme.match(/(\d+)-slide/);
if (!claimed || Number(claimed[1]) !== slides) {
  failures.push(`README claims ${claimed ? claimed[1] : 'no'}-slide but deck has ${slides}`);
}

if (process.argv.includes('--links')) {
  const urls = new Set();
  for (const { text } of all) {
    for (const m of text.matchAll(/https:\/\/academy\.claude\.com[^\s)>\]"'`]*/g)) urls.add(m[0]);
  }
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!res.ok) failures.push(`link ${url} returned ${res.status}`);
    } catch (e) {
      failures.push(`link ${url} failed: ${e.message}`);
    }
  }
}

for (const f of failures) console.log(`FAIL: ${f}`);
console.log(failures.length ? `${failures.length} problem(s); deck has ${slides} slides` : `OK; deck has ${slides} slides`);
process.exit(failures.length ? 1 : 0);
