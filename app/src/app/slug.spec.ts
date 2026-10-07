import { describe, expect, it } from 'vitest';
import { slidePath, slug } from './slug';

describe('slug', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slug('What is a Skill?')).toBe('what-is-a-skill');
  });
  it('drops punctuation, emoji and repeated separators', () => {
    expect(slug('🛠 Exercise 3 — Skills')).toBe('exercise-3-skills');
    expect(slug('  --Hook   exit codes!! ')).toBe('hook-exit-codes');
  });
  it('limits length without ending on a hyphen', () => {
    const s = slug('a very long title that keeps going and going well past the limit', 24);
    expect(s.length).toBeLessThanOrEqual(24);
    expect(s.endsWith('-')).toBe(false);
  });
  it('falls back for empty input', () => {
    expect(slug('???')).toBe('untitled');
  });
});

describe('slidePath', () => {
  it('builds a path from a numbered section and a title', () => {
    expect(slidePath('5. Hooks', 'What are Hooks?')).toBe('~/deep-dive/05-hooks/what-are-hooks.md');
  });
  it('keeps unnumbered sections as plain names', () => {
    expect(slidePath('Putting it together', 'The full picture')).toBe('~/deep-dive/putting-it-together/the-full-picture.md');
    expect(slidePath('Intro', 'Cover')).toBe('~/deep-dive/intro/cover.md');
  });
  it('handles colons in section names', () => {
    expect(slidePath('8. Claude Code: shortcuts and commands', 'Claude Code commands cheat sheet (1/2)')).toBe(
      '~/deep-dive/08-claude-code-shortcuts-and-commands/claude-code-commands-cheat-sheet-1-2.md',
    );
  });
});
