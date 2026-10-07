import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeckData } from './deck.model';
import { DeckService } from './deck.service';

const data: DeckData = {
  updated: '2026-10-07',
  slides: [
    { id: 1, section: 'Intro', title: 'Cover', html: '<h1>Cover</h1>' },
    { id: 2, section: '1. Alpha', title: 'A1', html: '<p>a1</p>' },
    { id: 3, section: '1. Alpha', title: 'A2', html: '<p>a2</p>' },
    { id: 4, section: '2. Beta', title: 'B1', html: '<p>b1</p>' },
    { id: 5, section: '2. Beta', title: 'B2', html: '<p>b2</p>' },
  ],
};

describe('DeckService', () => {
  let deck: DeckService;

  beforeEach(() => {
    window.location.hash = '';
    TestBed.configureTestingModule({});
    deck = TestBed.inject(DeckService);
  });

  it('starts on the first slide after loading', () => {
    deck.load(data);
    expect(deck.index()).toBe(0);
    expect(deck.current().title).toBe('Cover');
    expect(deck.total()).toBe(5);
    expect(deck.updated()).toBe('2026-10-07');
  });

  it('next and prev stay within bounds', () => {
    deck.load(data);
    deck.prev();
    expect(deck.index()).toBe(0);
    for (let i = 0; i < 10; i++) deck.next();
    expect(deck.index()).toBe(4);
    deck.prev();
    expect(deck.index()).toBe(3);
  });

  it('goTo clamps out-of-range and non-integer values', () => {
    deck.load(data);
    deck.goTo(99);
    expect(deck.index()).toBe(4);
    deck.goTo(-5);
    expect(deck.index()).toBe(0);
    deck.goTo(Number.NaN);
    expect(deck.index()).toBe(0);
  });

  it('reads the starting slide from the URL hash (1-based)', () => {
    window.location.hash = '#/3';
    deck.load(data);
    expect(deck.index()).toBe(2);
  });

  it('ignores a bad hash and clamps a too-large one', () => {
    window.location.hash = '#/abc';
    deck.load(data);
    expect(deck.index()).toBe(0);
    window.location.hash = '#/500';
    deck.load(data);
    expect(deck.index()).toBe(4);
  });

  it('writes the 1-based slide number to the hash when navigating', () => {
    deck.load(data);
    deck.next();
    expect(window.location.hash).toBe('#/2');
    deck.goTo(4);
    expect(window.location.hash).toBe('#/5');
  });

  it('groups slides into sections with first index and count', () => {
    deck.load(data);
    expect(deck.sections()).toEqual([
      { name: 'Intro', firstIndex: 0, count: 1 },
      { name: '1. Alpha', firstIndex: 1, count: 2 },
      { name: '2. Beta', firstIndex: 3, count: 2 },
    ]);
  });

  it('goToSection jumps to the first slide of a section', () => {
    deck.load(data);
    deck.goToSection('2. Beta');
    expect(deck.index()).toBe(3);
    deck.goToSection('Missing');
    expect(deck.index()).toBe(3);
  });

  it('reports progress from 0 to 1', () => {
    deck.load(data);
    expect(deck.progress()).toBe(0);
    deck.goTo(2);
    expect(deck.progress()).toBe(0.5);
    deck.goTo(4);
    expect(deck.progress()).toBe(1);
  });

  it('exposes the current section name', () => {
    deck.load(data);
    deck.goTo(2);
    expect(deck.currentSection()).toBe('1. Alpha');
  });

  it('tracks the direction of travel', () => {
    deck.load(data);
    deck.goTo(3);
    expect(deck.direction()).toBe(1);
    deck.prev();
    expect(deck.direction()).toBe(-1);
    deck.goTo(3);
    expect(deck.direction()).toBe(1);
    deck.goTo(3); // no movement: direction unchanged
    expect(deck.direction()).toBe(1);
  });

  it('survives an empty deck without throwing', () => {
    deck.load({ updated: '', slides: [] });
    expect(deck.total()).toBe(0);
    expect(deck.progress()).toBe(0);
    deck.next();
    expect(deck.index()).toBe(0);
  });
});
