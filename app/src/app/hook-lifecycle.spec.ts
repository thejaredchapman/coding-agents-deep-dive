import { describe, expect, it } from 'vitest';
import { HookLifecycle } from './hook-lifecycle';

describe('HookLifecycle', () => {
  it('starts on the first step with the full path', () => {
    const h = new HookLifecycle();
    expect(h.activeStep().id).toBe('SessionStart');
    expect(h.pathIds()).toEqual(['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'Tool', 'PostToolUse', 'Stop']);
  });

  it('next and prev move along the path and stop at the ends', () => {
    const h = new HookLifecycle();
    h.prev();
    expect(h.activeStep().id).toBe('SessionStart');
    for (let i = 0; i < 10; i++) h.next();
    expect(h.activeStep().id).toBe('Stop');
    expect(h.atEnd()).toBe(true);
    h.prev();
    expect(h.activeStep().id).toBe('PostToolUse');
  });

  it('reports each step as done, active, todo', () => {
    const h = new HookLifecycle();
    h.next();
    h.next();
    expect(h.stateOf('SessionStart')).toBe('done');
    expect(h.stateOf('UserPromptSubmit')).toBe('done');
    expect(h.stateOf('PreToolUse')).toBe('active');
    expect(h.stateOf('Tool')).toBe('todo');
  });

  it('blocking at PreToolUse skips the tool and PostToolUse', () => {
    const h = new HookLifecycle();
    h.setBlocked(true);
    expect(h.pathIds()).toEqual(['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'Stop']);
    expect(h.stateOf('Tool')).toBe('skipped');
    expect(h.stateOf('PostToolUse')).toBe('skipped');
    for (let i = 0; i < 3; i++) h.next();
    expect(h.activeStep().id).toBe('Stop');
  });

  it('describes the blocked outcome on PreToolUse', () => {
    const h = new HookLifecycle();
    h.setBlocked(true);
    h.next();
    h.next();
    expect(h.caption()).toMatch(/code 2/i);
    expect(h.caption()).toMatch(/blocked/i);
  });

  it('toggling block keeps the position valid', () => {
    const h = new HookLifecycle();
    for (let i = 0; i < 5; i++) h.next(); // on Stop in the full path (index 5)
    h.setBlocked(true); // path is now shorter
    expect(h.activeStep().id).toBe('Stop');
    h.setBlocked(false);
    expect(h.activeStep().id).toBe('Stop');
  });

  it('reset returns to the start', () => {
    const h = new HookLifecycle();
    h.next();
    h.next();
    h.reset();
    expect(h.activeStep().id).toBe('SessionStart');
  });

  it('every step has a caption', () => {
    const h = new HookLifecycle();
    do {
      expect(h.caption().length).toBeGreaterThan(10);
      h.next();
    } while (!h.atEnd());
  });
});
