import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { DeckData } from './deck.model';
import { DeckService } from './deck.service';

const data: DeckData = {
  updated: '2026-10-07',
  slides: [
    { id: 1, section: 'Intro', title: 'Coding Agents — Deep Dive', html: '<h1>Cover</h1>' },
    { id: 2, section: '1. Alpha', title: 'A1', html: '<h2>A1</h2><pre><code>echo hi</code></pre><p><a href="https://example.com">link</a></p>' },
    { id: 3, section: '1. Alpha', title: 'A2', html: '<h2>A2</h2>', diagram: 'hooks' },
    { id: 4, section: '2. Beta', title: 'Exercise 1', html: '<h2>Ex</h2>', checklist: ['Part A', 'Part B'] },
  ],
};

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let el: HTMLElement;
  let deck: DeckService;

  async function render() {
    fixture = TestBed.createComponent(App);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }
  const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));

  beforeEach(async () => {
    localStorage.clear();
    window.location.hash = '';
    document.documentElement.removeAttribute('data-theme');
    deck = TestBed.inject(DeckService);
    deck.load(data);
    await render();
  });

  it('shows the first slide and the last-updated date', () => {
    expect(el.querySelector('.slide-content h1')?.textContent).toBe('Cover');
    expect(el.querySelector('.updated time')?.textContent?.trim()).toBe('2026-10-07');
    expect(el.querySelector('.updated time')?.getAttribute('datetime')).toBe('2026-10-07');
    expect(el.querySelector('.counter')?.textContent?.trim()).toBe('1 / 4');
  });

  it('moves with the arrow keys and announces the slide', async () => {
    press('ArrowRight');
    await fixture.whenStable();
    expect(el.querySelector('.slide-content h2')?.textContent).toBe('A1');
    expect(el.querySelector('[aria-live]')?.textContent).toContain('Slide 2 of 4: A1');
    press('ArrowLeft');
    await fixture.whenStable();
    expect(el.querySelector('.slide-content h1')?.textContent).toBe('Cover');
  });

  it('sets the page title without repeating the deck name on the cover', async () => {
    expect(document.title).toBe('Coding Agents — Deep Dive');
    deck.goTo(1);
    await fixture.whenStable();
    expect(document.title).toBe('A1 · Coding Agents — Deep Dive');
  });

  it('updates the progress bar', async () => {
    deck.goTo(3);
    await fixture.whenStable();
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('does not steal keys while typing in a field', async () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    press('ArrowRight', {}, input);
    await fixture.whenStable();
    expect(deck.index()).toBe(0);
    input.remove();
  });

  it('ignores Space on a focused button so the button still works', async () => {
    const button = el.querySelector('footer button') as HTMLElement;
    press(' ', {}, button);
    await fixture.whenStable();
    expect(deck.index()).toBe(0);
    press(' ');
    await fixture.whenStable();
    expect(deck.index()).toBe(1);
  });

  it('ignores shortcuts that include modifier keys', async () => {
    press('ArrowRight', { ctrlKey: true });
    await fixture.whenStable();
    expect(deck.index()).toBe(0);
  });

  it('swipes between slides but not on tables or code', async () => {
    const main = el.querySelector('main')!;
    const swipe = (dx: number, target: Element = main) => {
      target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 100 }));
      target.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 200 + dx, clientY: 105 }));
    };
    swipe(-120);
    await fixture.whenStable();
    expect(deck.index()).toBe(1);
    swipe(120);
    await fixture.whenStable();
    expect(deck.index()).toBe(0);
    swipe(-20);
    expect(deck.index()).toBe(0);
    deck.goTo(1);
    await fixture.whenStable();
    swipe(-120, el.querySelector('pre')!);
    expect(deck.index()).toBe(1);
  });

  it('toggles the theme from the button and the T key', async () => {
    const button = el.querySelector('.actions button:last-child') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    press('t');
    await fixture.whenStable();
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('jumps to a section from the sidebar', async () => {
    const buttons = Array.from(el.querySelectorAll('.sidebar button')) as HTMLButtonElement[];
    buttons.find((b) => b.textContent?.includes('2. Beta'))!.click();
    await fixture.whenStable();
    expect(deck.index()).toBe(3);
    expect(el.querySelector('.sidebar button.active')?.textContent).toContain('2. Beta');
  });

  it('adds copy buttons to code blocks and opens external links safely', async () => {
    deck.goTo(1);
    await fixture.whenStable();
    expect(el.querySelector('pre button.copy')).not.toBeNull();
    const link = el.querySelector('.slide-content a')!;
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('renders a diagram on slides that have one', async () => {
    deck.goTo(2);
    await fixture.whenStable();
    expect(el.querySelector('svg[role="img"] title')?.textContent).toBe('Hook lifecycle');
  });

  it('shows and saves exercise checklists', async () => {
    deck.goTo(3);
    await fixture.whenStable();
    const boxes = Array.from(el.querySelectorAll('.checklist input')) as HTMLInputElement[];
    expect(boxes.length).toBe(2);
    boxes[0].click();
    await fixture.whenStable();
    expect(el.querySelector('.checklist legend')?.textContent).toContain('1 of 2');
    expect(localStorage.getItem('deck-checklists-v1')).toContain('Exercise 1');
  });

  it('opens and closes the shortcut help', async () => {
    press('?');
    await fixture.whenStable();
    expect(el.querySelector('[role="dialog"]')).not.toBeNull();
    press('Escape');
    await fixture.whenStable();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows an error instead of a blank page when the slides fail to load', async () => {
    TestBed.resetTestingModule();
    const broken = TestBed.inject(DeckService);
    await broken.loadFromUrl('does-not-exist.json');
    await render();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Could not load the slides');
  });
});
