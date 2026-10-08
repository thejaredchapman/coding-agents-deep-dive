import { describe, expect, it } from 'vitest';
import { guideIdFromHash, rankTools } from './guide.service';

describe('guideIdFromHash', () => {
  it('reads the section id', () => expect(guideIdFromHash('#/guide/safeguards')).toBe('safeguards'));
  it('is null for the welcome page and other pages', () => {
    expect(guideIdFromHash('#/guide')).toBeNull();
    expect(guideIdFromHash('#/guide/')).toBeNull();
    expect(guideIdFromHash('#/providers')).toBeNull();
    expect(guideIdFromHash('#/12')).toBeNull();
  });
});

describe('rankTools', () => {
  const tools = [
    { id: 'a', name: 'Zed', needs: ['x'] },
    { id: 'b', name: 'Aider', needs: ['x', 'y'] },
    { id: 'c', name: 'Cline', needs: ['x', 'y'] },
  ];
  it('puts the most matches first and breaks ties by name', () => {
    expect(rankTools(tools, ['x', 'y']).map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });
  it('lists the matching needs per tool', () => {
    expect(rankTools(tools, ['y'])[0].hits).toEqual(['y']);
  });
  it('orders by name when nothing is picked', () => {
    expect(rankTools(tools, []).map((t) => t.name)).toEqual(['Aider', 'Cline', 'Zed']);
  });
});
