import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { DeckData } from './deck.model';
import { DeckService } from './deck.service';
import { ExplorerService } from './explorer';
import { ToolService } from './tool.service';
import { UiService } from './ui.service';

const data: DeckData = {
  updated: '2026-10-07',
  slides: [
    { id: 1, section: 'Intro', title: 'Coding Agents — Deep Dive', html: '<h1>Cover</h1>' },
    { id: 2, section: '1. Alpha', title: 'A1', html: '<h2>A1</h2><pre><code>echo hi</code></pre><p><a href="https://example.com">link</a></p>' },
    { id: 3, section: '1. Alpha', title: 'A2', html: '<h2>A2</h2>', diagram: 'hooks' },
    { id: 4, section: '2. Beta', title: 'Exercise 1', html: '<h2>Ex</h2>', checklist: ['Part A', 'Part B'] },
    {
      id: 5,
      section: '9. Codex',
      title: 'Compare',
      html: '<table><thead><tr><th></th><th>Claude Code</th><th>Codex</th><th>Cursor</th></tr></thead><tbody><tr><td>MCP</td><td>claude mcp add</td><td>codex mcp add</td><td>mcp.json</td></tr></tbody></table>',
    },
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
    expect(el.querySelector('.counter')?.textContent?.trim()).toBe('1 / 5');
  });

  it('moves with the arrow keys and announces the slide', async () => {
    press('ArrowRight');
    await fixture.whenStable();
    expect(el.querySelector('.slide-content h2')?.textContent).toBe('A1');
    expect(el.querySelector('[aria-live]')?.textContent).toContain('Slide 2 of 5: A1');
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
    expect(bar.getAttribute('aria-valuenow')).toBe('75');
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
    const button = el.querySelector('.actions .theme') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    press('t');
    await fixture.whenStable();
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('jumps to a section from the sidebar', async () => {
    const buttons = Array.from(el.querySelectorAll('.sidebar button')) as HTMLButtonElement[];
    buttons.find((b) => b.textContent?.includes('Beta'))!.click();
    await fixture.whenStable();
    expect(deck.index()).toBe(3);
    expect(el.querySelector('.sidebar button.active')?.textContent).toContain('Beta');
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
    expect(el.querySelector('svg[role="img"] title')?.textContent).toBe('Hook lifecycle, interactive');
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

  describe('tool personalization', () => {
    it('shows a picker on the cover and tints the page when a tool is chosen', async () => {
      const chips = Array.from(el.querySelectorAll<HTMLButtonElement>('.cover-picker .chip'));
      expect(chips.map((c) => c.textContent?.trim())).toEqual(['●Claude Code', '▲Codex', '■Cursor', '◆Gemini CLI', 'All']);
      chips[1].click();
      await fixture.whenStable();
      expect(document.documentElement.dataset['tool']).toBe('codex');
      expect(chips[1].getAttribute('aria-pressed')).toBe('true');
      chips[1].click(); // clicking again clears
      await fixture.whenStable();
      expect(document.documentElement.dataset['tool']).toBeUndefined();
    });

    it('offers a jump to the chosen tool\'s section, from the footer and the M key', async () => {
      expect(el.querySelector('footer .mine')).toBeNull();
      TestBed.inject(ToolService).select('codex');
      await fixture.whenStable();
      const jump = el.querySelector<HTMLButtonElement>('footer .mine')!;
      expect(jump.textContent).toContain('Codex');
      jump.click();
      expect(deck.index()).toBe(4);
      deck.goTo(0);
      press('m');
      expect(deck.index()).toBe(4);
    });

    it('marks the chosen tool\'s section in the sidebar', async () => {
      TestBed.inject(ToolService).select('codex');
      await fixture.whenStable();
      expect(el.querySelector('.sidebar button.mine')?.textContent).toContain('Codex');
    });

    it('tags comparison-table columns and adds compare controls', async () => {
      deck.goTo(4);
      await fixture.whenStable();
      expect(el.querySelector('th[data-t="codex"]')).not.toBeNull();
      expect(el.querySelectorAll('.table-tools input[type="checkbox"]').length).toBe(3);
    });
  });

  describe('search and commands', () => {
    it('opens with / and with Ctrl+K, and closes with Escape', async () => {
      press('/');
      await fixture.whenStable();
      const dialog = el.querySelector('[role="dialog"][aria-label="Search and commands"]');
      expect(dialog).not.toBeNull();
      expect(el.querySelector('input[role="combobox"]')).not.toBeNull();
      press('Escape', {}, el.querySelector('input[role="combobox"]')!);
      await fixture.whenStable();
      expect(el.querySelector('app-command-palette')).toBeNull();
      press('k', { ctrlKey: true });
      await fixture.whenStable();
      expect(el.querySelector('app-command-palette')).not.toBeNull();
    });

    it('finds a slide and jumps to it with Enter', async () => {
      press('/');
      await fixture.whenStable();
      const input = el.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      input.value = 'A2';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      const options = Array.from(el.querySelectorAll('[role="option"]'));
      expect(options.some((o) => o.textContent?.includes('A2'))).toBe(true);
      // arrow down to the slide result, then Enter
      const slideIndex = options.findIndex((o) => !o.classList.contains('action'));
      for (let i = 0; i < slideIndex; i++) press('ArrowDown', {}, input);
      press('Enter', {}, input);
      await fixture.whenStable();
      expect(deck.index()).toBe(2);
      expect(el.querySelector('app-command-palette')).toBeNull();
    });

    it('runs actions: choose a tool', async () => {
      press('/');
      await fixture.whenStable();
      const input = el.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      input.value = 'choose cursor';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      press('Enter', {}, input);
      await fixture.whenStable();
      expect(TestBed.inject(ToolService).selected()).toBe('cursor');
    });

    it('does not navigate slides with the arrow keys while it is open', async () => {
      press('/');
      await fixture.whenStable();
      press('ArrowRight');
      expect(deck.index()).toBe(0);
    });

    it('says when nothing matches', async () => {
      press('/');
      await fixture.whenStable();
      const input = el.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      input.value = 'zzzzqqq';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      expect(el.querySelector('.none')?.textContent).toContain('Nothing matches');
    });
  });

  describe('shortcut and command explorer', () => {
    beforeEach(async () => {
      TestBed.inject(ExplorerService).items.set([
        { tool: 'claude', kind: 'shortcut', group: 'Session', keys: 'Ctrl+C', keysHtml: '<kbd>Ctrl+C</kbd>', action: 'Interrupt' },
        { tool: 'gemini', kind: 'shortcut', group: 'Session', keys: 'Ctrl+C', keysHtml: '<kbd>Ctrl+C</kbd>', action: 'Cancel' },
        { tool: 'codex', kind: 'command', group: 'Commands', keys: '/permissions', keysHtml: '<kbd>/permissions</kbd>', action: 'Change sandbox' },
      ]);
      press('e');
      await fixture.whenStable();
    });

    it('opens with E and lists every tool\'s entries', () => {
      expect(el.querySelector('[role="dialog"][aria-labelledby="explorer-title"]')).not.toBeNull();
      expect(el.querySelectorAll('.explorer section.tool').length).toBe(3);
      expect(el.querySelector('.explorer .count')?.textContent).toContain('3 entries');
    });

    it('filters by tool and by text', async () => {
      const chip = el.querySelector<HTMLButtonElement>('.explorer .chip[data-t="gemini"]')!;
      chip.click();
      await fixture.whenStable();
      expect(el.querySelectorAll('.explorer section.tool').length).toBe(1);
      chip.click();
      const search = el.querySelector<HTMLInputElement>('.explorer input[type="search"]')!;
      search.value = 'sandbox';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      expect(el.querySelectorAll('.explorer section.tool').length).toBe(1);
      expect(el.querySelector('.explorer dd')?.textContent).toBe('Change sandbox');
    });

    it('puts the chosen tool first and renders key caps', async () => {
      TestBed.inject(ToolService).select('gemini');
      await fixture.whenStable();
      expect(el.querySelector('.explorer section.tool')?.getAttribute('data-t')).toBe('gemini');
      expect(el.querySelector('.explorer dt kbd')?.textContent).toBe('Ctrl+C');
    });

    it('notes that the Codex list is partial and closes with Escape', async () => {
      expect(el.querySelector('.explorer .note')?.textContent).toContain('partial');
      press('Escape', {}, el.querySelector('.explorer')!);
      await fixture.whenStable();
      expect(TestBed.inject(UiService).explorerOpen()).toBe(false);
    });
  });

  describe('interactive hook lifecycle', () => {
    it('steps through the events and can block at PreToolUse', async () => {
      deck.load({ ...data, slides: [...data.slides, { id: 6, section: '5. Hooks', title: 'What are Hooks?', html: '<p>h</p>', diagram: 'hooks' }] });
      deck.goTo(5);
      await fixture.whenStable();
      const caption = () => el.querySelector('.stepper .caption')?.textContent ?? '';
      expect(caption()).toContain('SessionStart');
      const step = Array.from(el.querySelectorAll<HTMLButtonElement>('.stepper-controls button')).find((b) => b.textContent?.includes('Step'))!;
      step.click();
      step.click();
      await fixture.whenStable();
      expect(caption()).toContain('PreToolUse');
      const box = el.querySelector<HTMLInputElement>('.stepper-controls input[type="checkbox"]')!;
      box.checked = true;
      box.dispatchEvent(new Event('change', { bubbles: true }));
      await fixture.whenStable();
      expect(caption()).toMatch(/code 2/i);
      expect(el.querySelector('.node.skipped')).not.toBeNull();
      expect(el.querySelector('.stepper svg text.danger')?.textContent).toContain('blocked');
    });
  });

  it('shows an error instead of a blank page when the slides fail to load', async () => {
    TestBed.resetTestingModule();
    const broken = TestBed.inject(DeckService);
    await broken.loadFromUrl('does-not-exist.json');
    await render();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Could not load the slides');
  });
});
