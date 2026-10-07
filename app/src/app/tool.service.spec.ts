import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeckService } from './deck.service';
import { ToolService } from './tool.service';
import { toolFromHeader } from './tools';

describe('toolFromHeader', () => {
  it('matches tool names ignoring case and spacing', () => {
    expect(toolFromHeader(' Claude Code ')).toBe('claude');
    expect(toolFromHeader('codex')).toBe('codex');
    expect(toolFromHeader('Cursor')).toBe('cursor');
    expect(toolFromHeader('Gemini CLI')).toBe('gemini');
  });
  it('returns null for anything else', () => {
    expect(toolFromHeader('Idea')).toBeNull();
    expect(toolFromHeader('')).toBeNull();
  });
});

describe('ToolService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['tool'];
  });
  afterEach(() => vi.restoreAllMocks());

  it('starts with no tool selected and no data-tool attribute', () => {
    const tool = TestBed.inject(ToolService);
    expect(tool.selected()).toBeNull();
    expect(document.documentElement.dataset['tool']).toBeUndefined();
  });

  it('select sets the signal, the document attribute and storage', () => {
    const tool = TestBed.inject(ToolService);
    tool.select('codex');
    expect(tool.selected()).toBe('codex');
    expect(tool.info()?.name).toBe('Codex');
    expect(document.documentElement.dataset['tool']).toBe('codex');
    expect(localStorage.getItem('deck-tool')).toBe('codex');
  });

  it('selecting null clears everything', () => {
    const tool = TestBed.inject(ToolService);
    tool.select('cursor');
    tool.select(null);
    expect(tool.selected()).toBeNull();
    expect(document.documentElement.dataset['tool']).toBeUndefined();
    expect(localStorage.getItem('deck-tool')).toBeNull();
  });

  it('restores a stored choice and ignores junk', () => {
    localStorage.setItem('deck-tool', 'gemini');
    expect(TestBed.inject(ToolService).selected()).toBe('gemini');
    TestBed.resetTestingModule();
    localStorage.setItem('deck-tool', 'vim');
    expect(TestBed.inject(ToolService).selected()).toBeNull();
  });

  it('works when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const tool = TestBed.inject(ToolService);
    expect(() => tool.select('claude')).not.toThrow();
    expect(tool.selected()).toBe('claude');
  });

  it('jumps to the selected tool\'s section', () => {
    const deck = TestBed.inject(DeckService);
    deck.load({
      updated: '2026-10-07',
      slides: [
        { id: 1, section: 'Intro', title: 'Cover', html: '' },
        { id: 2, section: '9. Codex', title: 'Codex: what it is', html: '' },
        { id: 3, section: '10. Cursor', title: 'Cursor: what it is', html: '' },
      ],
    });
    const tool = TestBed.inject(ToolService);
    tool.jumpToMine();
    expect(deck.index()).toBe(0); // nothing selected: stays put
    tool.select('cursor');
    tool.jumpToMine();
    expect(deck.index()).toBe(2);
  });
});
