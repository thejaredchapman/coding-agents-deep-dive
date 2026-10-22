import { describe, expect, it } from 'vitest';
import { NEEDS, TOOL_FIT, rankTools } from './needs-picker.data';

describe('rankTools', () => {
  const tools = [
    { id: 'a', name: 'Zed', needs: ['x'] },
    { id: 'b', name: 'Aider', needs: ['x', 'y'] },
    { id: 'c', name: 'Cline', needs: ['x', 'y'] },
  ];
  it('puts the most matches first and breaks ties by name', () => {
    expect(rankTools(tools, ['x', 'y']).map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });
  it('lists the matching needs per tool', () => expect(rankTools(tools, ['y'])[0].hits).toEqual(['y']));
  it('orders by name when nothing is picked', () => {
    expect(rankTools(tools, []).map((t) => t.name)).toEqual(['Aider', 'Cline', 'Zed']);
  });
});

describe('picker data', () => {
  it('only references needs that exist', () => {
    const ids = new Set(NEEDS.map((n) => n.id));
    for (const t of TOOL_FIT) for (const n of t.needs) expect(ids.has(n), `${t.id}:${n}`).toBe(true);
  });
});
