import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
  afterEach(() => vi.restoreAllMocks());

  it('defaults to light when nothing is stored and the system has no dark preference', () => {
    const theme = TestBed.inject(ThemeService);
    expect(theme.theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('follows a dark system preference when nothing is stored', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const theme = TestBed.inject(ThemeService);
    expect(theme.theme()).toBe('dark');
    vi.unstubAllGlobals();
  });

  it('prefers a stored choice over the system preference', () => {
    localStorage.setItem('deck-theme', 'dark');
    const theme = TestBed.inject(ThemeService);
    expect(theme.theme()).toBe('dark');
  });

  it('toggle flips the theme, updates the document and persists', () => {
    const theme = TestBed.inject(ThemeService);
    theme.toggle();
    expect(theme.theme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('deck-theme')).toBe('dark');
    theme.toggle();
    expect(theme.theme()).toBe('light');
  });

  it('still works when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const theme = TestBed.inject(ThemeService);
    expect(() => theme.toggle()).not.toThrow();
    expect(theme.theme()).toBe('dark');
  });
});
