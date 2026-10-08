import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { DeckData } from './deck.model';
import { DeckService } from './deck.service';
import { ExplorerService } from './explorer';
import { GuideData } from './guide.model';
import { GuideService } from './guide.service';
import { PageService } from './page.service';
import { ProvidersData } from './providers.model';
import { ProvidersService } from './providers.service';
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

const guide: GuideData = {
  source: 'Imported.',
  imported: '2026-10-07',
  splash: {
    tagline: 'Use any assistant responsibly.',
    what: { title: 'What is one?', text: 'An AI that helps with code.' },
    meaning: { title: 'What it means', bullets: ['You review.'] },
    why: { title: 'What to look for', bullets: ['Control.'], note: 'No tool is best.' },
    disclaimer: { title: 'Check with IT first', text: 'Follow your rules.' },
  },
  needs: [{ id: 'cheap', label: 'Free or low cost' }, { id: 'terminal', label: 'Work in the terminal' }],
  toolFit: [
    { id: 'aider', name: 'Aider', needs: ['cheap', 'terminal'] },
    { id: 'cursor', name: 'Cursor', needs: [] },
  ],
  sections: [
    { id: 'pick', title: 'Pick Your Tool', group: 'Start here', content: [{ heading: 'Tick what matters', picker: true }] },
    { id: 'safeguards', title: 'Safeguards', group: 'Start here', content: [{ heading: 'Limit the blast radius', bullets: ['Use a branch.'], warn: 'Agents run commands.' }] },
  ],
};

const providers: ProvidersData = {
  checked: '2026-10-07',
  providers: [
    { id: 'claude', name: 'Anthropic', product: 'Claude Code', summary: 'Terminal agent.', links: [{ label: 'Docs', url: 'https://code.claude.com/docs', kind: 'docs' }, { label: 'GitHub', url: 'https://github.com/anthropics/claude-code', kind: 'code' }] },
    { id: 'codex', name: 'OpenAI', product: 'Codex', summary: 'Terminal and app.', links: [{ label: 'Docs', url: 'https://developers.openai.com/codex', kind: 'docs' }] },
    { id: 'cursor', name: 'Cursor', product: 'Cursor', summary: 'Editor and CLI.', links: [{ label: 'Cursor', url: 'https://cursor.com', kind: 'product' }] },
    { id: 'gemini', name: 'Google', product: 'Gemini CLI', summary: 'Open-source agent.', links: [{ label: 'Docs', url: 'https://geminicli.com/docs/', kind: 'docs' }] },
  ],
  learning: [
    { provider: 'claude', title: 'Claude Academy', url: 'https://academy.claude.com/courses', cost: 'The site describes these as free.', summary: 'Courses on Claude Code and MCP.', items: [{ title: 'Claude Code 101', url: 'https://academy.claude.com/courses/claude-code-101' }] },
    { provider: 'codex', title: 'OpenAI Academy', url: 'https://academy.openai.com', cost: 'Confirm on the site.', summary: 'Pathways including Build with AI.', items: [{ title: 'Build with AI' }] },
    { provider: 'cursor', title: 'Cursor Learn', url: 'https://cursor.com/learn', cost: 'No price stated.', summary: 'Lessons on agents.', items: [] },
    { provider: 'gemini', title: 'Hands-on with Gemini CLI', url: 'https://codelabs.developers.google.com/gemini-cli-hands-on', cost: 'No price stated.', summary: 'A codelab.', items: [] },
    { provider: 'gemini', title: 'Google Skills', url: 'https://www.skills.google', cost: 'Free and paid options.', summary: 'Courses and labs.', items: [] },
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
    TestBed.inject(ProvidersService).data.set(providers);
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

  it('shows an editor-style mode in the statusline', async () => {
    const mode = () => el.querySelector('.statusline .mode')?.textContent?.trim();
    expect(mode()).toBe('NORMAL');
    press('/');
    await fixture.whenStable();
    expect(mode()).toBe('SEARCH');
    press('Escape', {}, el.querySelector('input[role="combobox"]')!);
    await fixture.whenStable();
    expect(mode()).toBe('NORMAL');
    press('e');
    await fixture.whenStable();
    expect(mode()).toBe('EXPLORE');
  });

  it('shows the chosen agent in the statusline', async () => {
    expect(el.querySelector('.statusline .tool')?.textContent?.trim()).toBe('all agents');
    TestBed.inject(ToolService).select('cursor');
    await fixture.whenStable();
    expect(el.querySelector('.statusline .tool')?.textContent).toContain('Cursor');
  });

  it('shows a file-path breadcrumb for the slide', async () => {
    expect(el.querySelector('.crumb')?.textContent?.trim()).toBe('~/deep-dive/intro/coding-agents-deep-dive.md');
    deck.goTo(4);
    await fixture.whenStable();
    expect(el.querySelector('.crumb')?.textContent?.trim()).toBe('~/deep-dive/09-codex/compare.md');
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

  describe('providers and free learning pages', () => {
    it('has links to the pages in the tab line, with the current one marked', async () => {
      const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('nav.pages a'));
      expect(links.map((a) => a.textContent?.trim())).toEqual(['slides', 'providers', 'free learning', 'guide']);
      expect(links[3].getAttribute('href')).toBe('#/guide');
      expect(links[0].getAttribute('aria-current')).toBe('page');
      expect(links[1].getAttribute('href')).toBe('#/providers');
      expect(links[2].getAttribute('href')).toBe('#/learn');
    });

    it('shows a card per provider with its official links in a new tab', async () => {
      TestBed.inject(PageService).show('providers');
      await fixture.whenStable();
      const cards = el.querySelectorAll('.card');
      expect(cards.length).toBe(4);
      expect(el.querySelector('h1')?.textContent).toBe('Providers');
      const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.card a[href^="https://"]'));
      expect(links.length).toBe(5);
      for (const a of links) {
        expect(a.getAttribute('target')).toBe('_blank');
        expect(a.getAttribute('rel')).toContain('noopener');
        expect(a.querySelector('.sr-only')?.textContent).toContain('new tab');
      }
      expect(el.querySelector('nav.pages a[aria-current="page"]')?.textContent?.trim()).toBe('providers');
      expect(el.querySelector('.sidebar')).toBeNull();
    });

    it('lists every provider\'s learning programs with cost, summary and a program page link', async () => {
      TestBed.inject(PageService).show('learn');
      await fixture.whenStable();
      const programs = Array.from(el.querySelectorAll('.program'));
      expect(programs.length).toBe(5);
      for (const p of programs) {
        expect(p.querySelector('.cost')?.textContent?.length).toBeGreaterThan(8);
        expect(p.querySelector('.blurb')?.textContent?.length).toBeGreaterThan(5);
        const cta = p.querySelector<HTMLAnchorElement>('a.cta')!;
        expect(cta.getAttribute('href')).toMatch(/^https:\/\//);
        expect(cta.getAttribute('rel')).toContain('noopener');
      }
      expect(el.querySelectorAll('.group').length).toBe(4);
      // programs that list items offer a disclosure; items with a url are links
      expect(el.querySelectorAll('details').length).toBe(2);
      expect(el.querySelector('details a[href="https://academy.claude.com/courses/claude-code-101"]')).not.toBeNull();
    });

    it('shows the guide, ranks tools against ticked needs, and links between sections', async () => {
      TestBed.inject(GuideService).data.set(guide);
      TestBed.inject(PageService).show('guide');
      await fixture.whenStable();
      expect(el.querySelector('h1')?.textContent).toBe('Guide');
      expect(el.querySelector('.warn')?.textContent).toContain('Check with IT first');
      window.location.hash = '#/guide/pick';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await fixture.whenStable();
      expect(el.querySelector('h1')?.textContent).toBe('Pick Your Tool');
      const boxes = el.querySelectorAll<HTMLInputElement>('.needs input');
      expect(boxes.length).toBe(2);
      boxes[0].click();
      await fixture.whenStable();
      expect(el.querySelector('.ranked li a')?.textContent).toBe('Aider');
      expect(el.querySelector('.ranked li .score')?.textContent).toBe('1/1');
      expect(el.querySelector('.pager a')?.getAttribute('href')).toBe('#/guide/safeguards');
    });

    it('finds guide sections from the palette', async () => {
      TestBed.inject(GuideService).data.set(guide);
      press('/');
      await fixture.whenStable();
      const input = el.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      input.value = 'blast radius';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      expect(el.textContent).toContain('Guide: Safeguards');
      press('Enter', {}, input);
      await fixture.whenStable();
      expect(el.querySelector('h1')?.textContent).toBe('Safeguards');
    });

    it('opens the guide with the G key', async () => {
      TestBed.inject(GuideService).data.set(guide);
      press('g');
      await fixture.whenStable();
      expect(el.querySelector('app-guide-page')).not.toBeNull();
    });

    it('marks the reader\'s own agent on both pages', async () => {
      TestBed.inject(ToolService).select('gemini');
      TestBed.inject(PageService).show('providers');
      await fixture.whenStable();
      expect(el.querySelector('.card.mine h2')?.textContent).toContain('Gemini CLI');
      TestBed.inject(PageService).show('learn');
      await fixture.whenStable();
      expect(el.querySelector('.group.mine h2')?.textContent).toContain('Gemini CLI');
    });

    it('switches with the P, L and D keys and from the palette', async () => {
      press('p');
      await fixture.whenStable();
      expect(el.querySelector('app-providers-page')).not.toBeNull();
      press('l');
      await fixture.whenStable();
      expect(el.querySelector('app-learn-page')).not.toBeNull();
      press('d');
      await fixture.whenStable();
      expect(el.querySelector('app-slide-view')).not.toBeNull();

      press('/');
      await fixture.whenStable();
      const input = el.querySelector<HTMLInputElement>('input[role="combobox"]')!;
      input.value = 'free learning';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      press('Enter', {}, input);
      await fixture.whenStable();
      expect(el.querySelector('app-learn-page')).not.toBeNull();
    });

    it('does not move through slides with the arrow keys while on a page, and Back to slides returns', async () => {
      TestBed.inject(PageService).show('providers');
      await fixture.whenStable();
      press('ArrowRight');
      expect(deck.index()).toBe(0);
      const back = Array.from(el.querySelectorAll<HTMLButtonElement>('footer button')).find((b) => b.textContent?.includes('back to slides'))!;
      back.click();
      await fixture.whenStable();
      expect(el.querySelector('app-slide-view')).not.toBeNull();
    });

    it('returns to the deck when a slide is chosen from search', async () => {
      TestBed.inject(PageService).show('learn');
      await fixture.whenStable();
      deck.goTo(2);
      await fixture.whenStable();
      expect(el.querySelector('app-slide-view')).not.toBeNull();
    });

    it('says so, instead of showing a blank page, when the data did not load', async () => {
      TestBed.inject(ProvidersService).data.set(null);
      TestBed.inject(PageService).show('providers');
      await fixture.whenStable();
      expect(el.querySelector('.muted')?.textContent).toContain('did not load');
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
