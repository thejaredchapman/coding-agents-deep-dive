import { describe, expect, it } from 'vitest';
import { ExplorerItem, filterExplorer } from './explorer';

const items: ExplorerItem[] = [
  { tool: 'claude', kind: 'shortcut', group: 'Session', keys: 'Ctrl+C', keysHtml: '<kbd>Ctrl+C</kbd>', action: 'Interrupt' },
  { tool: 'claude', kind: 'command', group: 'Commands', keys: '/init', keysHtml: '<kbd>/init</kbd>', action: 'Draft a CLAUDE.md' },
  { tool: 'gemini', kind: 'shortcut', group: 'Session', keys: 'Ctrl+C', keysHtml: '<kbd>Ctrl+C</kbd>', action: 'Cancel; quit when input is empty' },
  { tool: 'cursor', kind: 'shortcut', group: 'CLI', keys: 'Shift+Tab', keysHtml: '<kbd>Shift+Tab</kbd>', action: 'Rotate Agent, Plan, Ask modes' },
  { tool: 'codex', kind: 'command', group: 'Commands', keys: '/permissions', keysHtml: '<kbd>/permissions</kbd>', action: 'Change sandbox and approvals' },
];

describe('filterExplorer', () => {
  it('returns everything with no filters', () => {
    expect(filterExplorer(items, { tools: new Set(), kind: 'all', query: '' })).toHaveLength(5);
  });

  it('filters by tool, and an empty set means all tools', () => {
    const r = filterExplorer(items, { tools: new Set(['gemini']), kind: 'all', query: '' });
    expect(r.map((i) => i.tool)).toEqual(['gemini']);
  });

  it('filters by kind', () => {
    const r = filterExplorer(items, { tools: new Set(), kind: 'command', query: '' });
    expect(r.map((i) => i.keys)).toEqual(['/init', '/permissions']);
  });

  it('matches every word against keys, action and group, case-insensitively', () => {
    expect(filterExplorer(items, { tools: new Set(), kind: 'all', query: 'ctrl+c' })).toHaveLength(2);
    expect(filterExplorer(items, { tools: new Set(), kind: 'all', query: 'SANDBOX approvals' }).map((i) => i.tool)).toEqual(['codex']);
    expect(filterExplorer(items, { tools: new Set(), kind: 'all', query: 'session interrupt' }).map((i) => i.tool)).toEqual(['claude']);
    expect(filterExplorer(items, { tools: new Set(), kind: 'all', query: 'nonsense' })).toEqual([]);
  });

  it('lists the reader\'s own tool first and keeps the rest in order', () => {
    const r = filterExplorer(items, { tools: new Set(), kind: 'all', query: '', first: 'cursor' });
    expect(r[0].tool).toBe('cursor');
    expect(r.slice(1).map((i) => i.tool)).toEqual(['claude', 'claude', 'gemini', 'codex']);
  });
});
