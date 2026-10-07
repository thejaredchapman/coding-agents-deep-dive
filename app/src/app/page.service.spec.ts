import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeckService } from './deck.service';
import { PageService } from './page.service';

describe('PageService', () => {
  let pages: PageService;
  let deck: DeckService;

  beforeEach(() => {
    window.location.hash = '';
    deck = TestBed.inject(DeckService);
    deck.load({
      updated: '2026-10-07',
      slides: [1, 2, 3].map((id) => ({ id, section: 'Intro', title: `S${id}`, html: '' })),
    });
    pages = TestBed.inject(PageService);
  });

  it('starts on the deck', () => {
    expect(pages.page()).toBe('deck');
  });

  it('reads the page from the hash on load', () => {
    TestBed.resetTestingModule();
    window.location.hash = '#/learn';
    expect(TestBed.inject(PageService).page()).toBe('learn');
  });

  it('shows a page, writes the hash, and builds addresses', () => {
    pages.show('providers');
    expect(pages.page()).toBe('providers');
    expect(window.location.hash).toBe('#/providers');
    expect(pages.href('learn')).toBe('#/learn');
    expect(pages.href('deck')).toBe('#/1');
  });

  it('follows hash changes such as the Back button', () => {
    window.location.hash = '#/learn';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(pages.page()).toBe('learn');
    window.location.hash = '#/2';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(pages.page()).toBe('deck');
  });

  it('returns to the deck when the reader navigates slides', async () => {
    pages.show('providers');
    deck.next();
    TestBed.tick();
    expect(pages.page()).toBe('deck');
  });
});
