import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { DeckService } from './deck.service';
import { GuideService } from './guide.service';
import { useDialogFocus } from './dialog-focus';
import { buildIndex, search } from './search';
import { PageService } from './page.service';
import { ThemeService } from './theme.service';
import { ToolService } from './tool.service';
import { UiService } from './ui.service';

interface Row {
  kind: 'action' | 'slide';
  key: string;
  label: string;
  hint: string;
  detail?: string;
  run: () => void;
}

@Component({
  selector: 'app-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
})
export class CommandPalette {
  private readonly deck = inject(DeckService);
  private readonly tool = inject(ToolService);
  private readonly theme = inject(ThemeService);
  private readonly pages = inject(PageService);
  private readonly guide = inject(GuideService);
  protected readonly ui = inject(UiService);
  private readonly trap = useDialogFocus();

  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
  protected readonly query = signal('');
  protected readonly active = signal(0);

  private readonly index = computed(() => buildIndex(this.deck.slides()));

  private readonly actions = computed<Row[]>(() => {
    const rows: Row[] = [
      { kind: 'action', key: 'a-theme', label: `Switch to ${this.theme.theme() === 'dark' ? 'light' : 'dark'} theme`, hint: 'T', run: () => this.theme.toggle() },
      { kind: 'action', key: 'a-providers', label: 'Open the providers page: official links for each tool', hint: 'P', run: () => this.pages.show('providers') },
      { kind: 'action', key: 'a-learn', label: 'Open the free learning page', hint: 'L', run: () => this.pages.show('learn') },
      { kind: 'action', key: 'a-guide', label: 'Open the guide: pick a tool, IT checklist, safeguards, profiles', hint: 'G', run: () => this.pages.show('guide') },
      { kind: 'action', key: 'a-slides', label: 'Back to the slides', hint: 'D', run: () => this.pages.show('deck') },
      { kind: 'action', key: 'a-explorer', label: 'Open the shortcut and command explorer', hint: 'E', run: () => this.ui.openExplorer() },
      { kind: 'action', key: 'a-help', label: 'Show keyboard shortcuts for this app', hint: '?', run: () => this.ui.openHelp() },
    ];
    if (this.tool.info()) {
      rows.unshift({ kind: 'action', key: 'a-mine', label: `Jump to my tool: ${this.tool.info()!.name}`, hint: 'section', run: () => this.tool.jumpToMine() });
    }
    for (const t of this.tool.tools) {
      rows.push({ kind: 'action', key: `a-tool-${t.id}`, label: `Choose ${t.name}`, hint: t.glyph, run: () => this.tool.select(t.id) });
    }
    rows.push({ kind: 'action', key: 'a-all', label: 'Show all tools equally', hint: 'reset', run: () => this.tool.select(null) });
    rows.push({ kind: 'action', key: 'a-first', label: 'Go to the first slide', hint: 'Home', run: () => this.deck.goTo(0) });
    rows.push({ kind: 'action', key: 'a-last', label: 'Go to the last slide', hint: 'End', run: () => this.deck.goTo(this.deck.total() - 1) });
    return rows;
  });

  /** Guide sections, searchable by title, group and the headings and text inside them. */
  private readonly guideRows = computed<(Row & { haystack: string })[]>(() =>
    this.guide.sections().map((sec) => ({
      kind: 'action',
      key: `g-${sec.id}`,
      label: `Guide: ${sec.title}`,
      hint: sec.group,
      run: () => this.guide.show(sec.id),
      haystack: [sec.title, sec.group, ...sec.content.flatMap((b) => [b.heading, b.text ?? '', ...(b.bullets ?? [])])].join(' ').toLowerCase(),
    })),
  );

  protected readonly rows = computed<Row[]>(() => {
    const q = this.query().trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const actions = this.actions().filter((a) => words.every((w) => a.label.toLowerCase().includes(w)));
    const slides: Row[] = search(this.index(), q, 8).map((h) => ({
      kind: 'slide',
      key: `s-${h.id}`,
      label: h.title,
      hint: `${h.section} · ${h.id}`,
      detail: h.snippet,
      run: () => this.deck.goTo(h.id - 1),
    }));
    const guideHits = q === '' ? [] : this.guideRows().filter((g) => words.every((w) => g.haystack.includes(w))).slice(0, 4);
    return q === '' ? actions.slice(0, 8) : [...actions.slice(0, 5), ...guideHits, ...slides];
  });

  constructor() {
    afterNextRender(() => this.input()?.nativeElement.focus());
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  protected onKey(event: KeyboardEvent, dialog: HTMLElement): void {
    const count = this.rows().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.active.set(count ? (this.active() + 1) % count : 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.active.set(count ? (this.active() - 1 + count) % count : 0);
        break;
      case 'Enter':
        event.preventDefault();
        this.choose(this.active());
        break;
      case 'Escape':
        event.preventDefault();
        this.ui.paletteOpen.set(false);
        break;
      default:
        this.trap(event, dialog);
    }
  }

  protected choose(i: number): void {
    const row = this.rows()[i];
    if (!row) return;
    this.ui.paletteOpen.set(false);
    row.run();
  }
}
