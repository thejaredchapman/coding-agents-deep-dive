// Live link check for every https URL in deck.md, exercises, README and providers.json.
// 404/410/5xx and network errors fail. 401/403/429 are reported as "blocked": the site
// refuses automated requests, so open those in a browser instead of trusting a status code.
// 405 is accepted: MCP server URLs answer plain GETs that way.
import { readFileSync, readdirSync } from 'node:fs';

const files = ['deck.md', 'README.md', 'app/public/providers.json'];
for (const f of readdirSync('exercises')) if (f.endsWith('.md')) files.push(`exercises/${f}`);

const urls = new Map();
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/https:\/\/[^\s)>\]"'`\\,]+/g)) {
    const url = m[0].replace(/[.;:]+$/, '');
    if (/localhost|example\.com|\{\{/.test(url)) continue;
    if (!urls.has(url)) urls.set(url, f);
  }
}

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'coding-agents-deep-dive-link-check' } });
      if (res.ok || res.status === 405) return { status: 'ok' };
      if ([401, 403, 429].includes(res.status)) return { status: 'blocked', code: res.status };
      if (method === 'GET') return { status: 'fail', code: res.status };
    } catch (e) {
      if (method === 'GET') return { status: 'fail', code: e.cause?.code ?? e.message };
    }
  }
  return { status: 'fail', code: '?' };
}

const results = [];
const queue = [...urls];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const [url, file] = queue.shift();
    results.push({ url, file, ...(await check(url)) });
  }
}));

const bad = results.filter((r) => r.status === 'fail');
const blocked = results.filter((r) => r.status === 'blocked');
for (const r of blocked) console.log(`BLOCKED (${r.code}): ${r.url}  [${r.file}]`);
for (const r of bad) console.log(`FAIL (${r.code}): ${r.url}  [${r.file}]`);
console.log(`${results.length} links: ${results.length - bad.length - blocked.length} ok, ${blocked.length} blocked to bots, ${bad.length} failing`);
process.exit(bad.length ? 1 : 0);
