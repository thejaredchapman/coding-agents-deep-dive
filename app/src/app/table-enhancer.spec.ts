import { beforeEach, describe, expect, it } from 'vitest';
import { enhanceTables } from './table-enhancer';

const rosetta = `
<table>
  <thead><tr><th></th><th>Claude Code</th><th>Codex</th><th>Cursor</th><th>Gemini CLI</th></tr></thead>
  <tbody>
    <tr><td>Instructions</td><td>CLAUDE.md</td><td>AGENTS.md</td><td>rules</td><td>GEMINI.md</td></tr>
    <tr><td>MCP</td><td>claude mcp add</td><td>codex mcp add</td><td>mcp.json</td><td>gemini mcp add</td></tr>
  </tbody>
</table>`;

const plain = `
<table>
  <thead><tr><th>Idea</th><th>What it is</th></tr></thead>
  <tbody><tr><td>Hooks</td><td>Scripts</td></tr></tbody>
</table>`;

let root: HTMLElement;

beforeEach(() => {
  root = document.createElement('div');
});

describe('enhanceTables', () => {
  it('tags tool columns in headers and body cells', () => {
    root.innerHTML = rosetta;
    enhanceTables(root);
    const row = root.querySelector('tbody tr')!;
    const tags = Array.from(row.children).map((c) => c.getAttribute('data-t'));
    expect(tags).toEqual([null, 'claude', 'codex', 'cursor', 'gemini']);
    expect(root.querySelector('th[data-t="codex"]')?.textContent).toBe('Codex');
  });

  it('adds compare controls to tables with three or more tool columns', () => {
    root.innerHTML = rosetta;
    enhanceTables(root);
    const controls = root.querySelector('.table-tools');
    expect(controls).not.toBeNull();
    expect(controls!.querySelectorAll('input[type="checkbox"]').length).toBe(4);
    expect(controls!.querySelector('input[type="search"]')).not.toBeNull();
    expect(root.firstElementChild).toBe(controls);
  });

  it('leaves tables without tool columns alone', () => {
    root.innerHTML = plain;
    enhanceTables(root);
    expect(root.querySelector('.table-tools')).toBeNull();
    expect(root.querySelector('[data-t]')).toBeNull();
  });

  it('unchecking a tool hides its whole column and rechecking shows it', () => {
    root.innerHTML = rosetta;
    enhanceTables(root);
    const box = root.querySelector<HTMLInputElement>('input[data-t="cursor"]')!;
    box.checked = false;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    const hidden = root.querySelectorAll('.col-hidden');
    expect(hidden.length).toBe(3); // th + 2 body cells
    expect(Array.from(hidden).every((c) => c.getAttribute('data-t') === 'cursor')).toBe(true);
    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    expect(root.querySelectorAll('.col-hidden').length).toBe(0);
  });

  it('keeps at least one tool column visible', () => {
    root.innerHTML = rosetta;
    enhanceTables(root);
    const boxes = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    for (const b of boxes) {
      b.checked = false;
      b.dispatchEvent(new Event('change', { bubbles: true }));
    }
    expect(boxes.filter((b) => b.checked).length).toBe(1);
  });

  it('filters rows by text', () => {
    root.innerHTML = rosetta;
    enhanceTables(root);
    const search = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'mcp';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    const rows = Array.from(root.querySelectorAll<HTMLElement>('tbody tr'));
    expect(rows.map((r) => r.hidden)).toEqual([true, false]);
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(rows.every((r) => !r.hidden)).toBe(true);
  });

  it('wraps every table in a labelled, keyboard-scrollable region', () => {
    root.innerHTML = plain + rosetta;
    enhanceTables(root);
    const wraps = root.querySelectorAll('.table-wrap');
    expect(wraps.length).toBe(2);
    for (const w of Array.from(wraps)) {
      expect(w.getAttribute('role')).toBe('region');
      expect(w.getAttribute('aria-label')).toBeTruthy();
      expect(w.getAttribute('tabindex')).toBe('0');
      expect(w.querySelector('table')).not.toBeNull();
    }
  });

  it('adds soft break points to long paths without changing their text', () => {
    root.innerHTML = '<table><thead><tr><th>Codex</th></tr></thead><tbody><tr><td><code>.agents/skills/&lt;name&gt;/SKILL.md</code></td></tr></tbody></table>';
    enhanceTables(root);
    const code = root.querySelector('td code')!;
    expect(code.textContent).toBe('.agents/skills/<name>/SKILL.md');
    expect(code.querySelectorAll('wbr').length).toBeGreaterThanOrEqual(3);
    enhanceTables(root);
    expect(root.querySelector('td code')!.querySelectorAll('wbr').length).toBe(code.querySelectorAll('wbr').length);
  });

  it('does not detach a leading dot from its name', () => {
    root.innerHTML = '<table><thead><tr><th>Codex</th></tr></thead><tbody><tr><td><code>.claude/agents/*.md</code></td></tr></tbody></table>';
    enhanceTables(root);
    const chunks = Array.from(root.querySelector('td code')!.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent);
    expect(chunks).toEqual(['.claude/', 'agents/', '*.md']);
  });

  it('is idempotent', () => {
    root.innerHTML = rosetta;
    enhanceTables(root);
    enhanceTables(root);
    expect(root.querySelectorAll('.table-tools').length).toBe(1);
    expect(root.querySelectorAll('.table-wrap').length).toBe(1);
  });

  it('labels the controls for assistive tech', () => {
    root.innerHTML = rosetta;
    enhanceTables(root);
    expect(root.querySelector('.table-tools legend')?.textContent).toBeTruthy();
    expect(root.querySelector('input[type="search"]')?.getAttribute('aria-label')).toBeTruthy();
  });
});
