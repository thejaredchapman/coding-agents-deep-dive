import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../app/public/providers.json', import.meta.url), 'utf8'));
const TOOLS = ['claude', 'codex', 'cursor', 'gemini'];

function allUrls() {
  const urls = [];
  for (const p of data.providers) for (const l of p.links) urls.push(l.url);
  for (const l of data.learning) {
    urls.push(l.url);
    for (const i of l.items) if (i.url) urls.push(i.url);
  }
  return urls;
}

test('has a checked date', () => {
  assert.match(data.checked, /^\d{4}-\d{2}-\d{2}$/);
});

test('every tool has a provider with a summary and at least a docs link and a home or product link', () => {
  assert.deepEqual(data.providers.map((p) => p.id).sort(), [...TOOLS].sort());
  for (const p of data.providers) {
    assert.ok(p.name && p.product && p.summary, `${p.id} is missing a field`);
    const kinds = p.links.map((l) => l.kind);
    assert.ok(kinds.includes('docs'), `${p.id} has no docs link`);
    assert.ok(kinds.includes('product') || kinds.includes('company'), `${p.id} has no product or company link`);
  }
});

test('every tool has at least one learning program with a summary, cost note and program page', () => {
  for (const tool of TOOLS) {
    const programs = data.learning.filter((l) => l.provider === tool);
    assert.ok(programs.length >= 1, `${tool} has no learning program`);
    for (const l of programs) {
      assert.ok(l.title && l.summary && l.cost && l.url, `${l.title} is missing a field`);
      assert.ok(l.summary.length > 60, `${l.title} summary is too short`);
    }
  }
});

test('every URL is https, absolute and free of tracking parameters', () => {
  for (const u of allUrls()) {
    assert.match(u, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$)/, `bad URL: ${u}`);
    assert.ok(!/[?&](utm_|ref=)/.test(u), `tracking parameter in ${u}`);
  }
});

test('no URL is listed twice within one list', () => {
  for (const p of data.providers) {
    const urls = p.links.map((l) => l.url);
    assert.equal(new Set(urls).size, urls.length, `duplicate link for ${p.id}`);
  }
  for (const l of data.learning) {
    const urls = l.items.filter((i) => i.url).map((i) => i.url);
    assert.equal(new Set(urls).size, urls.length, `duplicate item in ${l.title}`);
  }
});

test('cost notes never claim "free" without saying where that comes from', () => {
  for (const l of data.learning) {
    if (/\bfree\b/i.test(l.cost)) {
      assert.match(l.cost, /(describes|stated|states|offers)/i, `${l.title}: "free" without a source in the cost note`);
    }
  }
});
