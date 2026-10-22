import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, output, signal } from '@angular/core';
import { ContentsItem, ContentsSection, buildContents, filterContents } from './contents';
import { DeckService } from './deck.service';
import { ToolService } from './tool.service';
import { TOOLS } from './tools';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter">
      <input type="search" placeholder="filter contents…" aria-label="Filter the contents" [value]="query()" (input)="query.set($any($event.target).value)" />
    </div>
    @if (groups().length === 0) {
      <p class="empty">Nothing matches "{{ query() }}".</p>
    }
    @for (g of groups(); track g.name) {
      <section class="group" [attr.aria-label]="g.name">
        <h3>{{ g.name }}</h3>
        @if (g.blurb) { <p class="blurb">{{ g.blurb }}</p> }
        <ul>
          @for (s of g.sections; track s.name) {
            <li>
              <div class="row">
                <button type="button" class="sec" [class.active]="s.name === deck.currentSection()" [class.mine]="isMine(s.name)" [attr.aria-current]="s.name === deck.currentSection() ? 'true' : null" (click)="pickSection(s)">
                  <span class="num">{{ number(s.name) }}</span>
                  <span class="name">{{ label(s.name) }}@if (isMine(s.name)) { <span class="you" aria-label="your agent">{{ tool.info()!.glyph }}</span> }</span>
                  <span class="count">{{ s.count }}</span>
                </button>
                <button type="button" class="toggle" [attr.aria-expanded]="isOpen(s.name)" [attr.aria-label]="'Topics in ' + label(s.name)" (click)="toggle(s.name)">
                  {{ isOpen(s.name) ? '▾' : '▸' }}
                </button>
              </div>
              @if (isOpen(s.name)) {
                <ul class="items">
                  @for (it of s.items; track it.index) {
                    <li>
                      <button type="button" class="item" [class.cur]="isCurrent(it)" [attr.aria-current]="isCurrent(it) ? 'true' : null" (click)="go(it)">
                        <span class="text">{{ it.label }}</span>
                        @if (it.count > 1) { <span class="n">{{ it.count }}</span> }
                      </button>
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    :host { display: block; }
    ul { list-style: none; margin: 0; padding: 0; }
    .filter { padding: 0 0.8rem 0.6rem; position: sticky; top: 0; background: var(--paper); z-index: 1; }
    input { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid var(--rule); border-radius: 6px; background: var(--raised); color: var(--ink); font: 0.8rem var(--mono); }
    input:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
    .empty { margin: 0.5rem 1rem; color: var(--muted); font-size: 0.85rem; }
    .group { padding: 0.4rem 0.4rem 0.2rem; }
    h3 { margin: 0.5rem 0.55rem 0; font: 700 0.68rem var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
    .blurb { margin: 0.1rem 0.55rem 0.35rem; font-size: 0.72rem; color: var(--muted); line-height: 1.35; }
    .row { display: grid; grid-template-columns: 1fr auto; align-items: stretch; }
    button { border: 0; background: none; color: var(--ink); font: 0.88rem var(--sans); text-align: left; border-radius: 6px; }
    button:hover { background: var(--hover); }
    .sec { display: grid; grid-template-columns: 1.5rem 1fr auto; gap: 0.3rem; align-items: baseline; padding: 0.38rem 0.5rem; }
    .sec.active { background: color-mix(in srgb, var(--accent) 15%, transparent); font-weight: 600; }
    .toggle { padding: 0 0.55rem; color: var(--muted); font: 0.8rem var(--mono); }
    .num, .count, .n { font: 0.7rem var(--mono); color: var(--muted); font-variant-numeric: tabular-nums; }
    .you { margin-left: 0.4em; color: var(--accent); font-size: 0.85em; }
    .sec.mine .name { color: var(--accent); }
    .items { margin: 0 0 0.3rem 1.55rem; padding-left: 0.5rem; border-left: 1px solid var(--rule); }
    .item { display: flex; justify-content: space-between; gap: 0.5rem; width: 100%; padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--muted); }
    .item:hover { color: var(--ink); }
    .item.cur { color: var(--accent); font-weight: 600; background: color-mix(in srgb, var(--accent) 10%, transparent); }
  `,
})
export class Sidebar {
  protected readonly deck = inject(DeckService);
  protected readonly tool = inject(ToolService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly picked = output<void>();

  protected readonly query = signal('');
  /** Sections the reader opened or closed by hand; the current section is open until they say otherwise. */
  private readonly override = signal<Record<string, boolean>>({});
  protected readonly all = computed(() => buildContents(this.deck.slides()));
  protected readonly groups = computed(() => filterContents(this.all(), this.query()));

  constructor() {
    // Keep the current entry visible when the reader moves through the deck.
    afterRenderEffect(() => {
      this.deck.index();
      this.host.nativeElement.querySelector('.item.cur, .sec.active')?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  protected isOpen(name: string): boolean {
    if (this.query().trim()) return true;
    return this.override()[name] ?? name === this.deck.currentSection();
  }

  protected toggle(name: string): void {
    this.override.update((o) => ({ ...o, [name]: !this.isOpen(name) }));
  }

  protected isCurrent(item: ContentsItem): boolean {
    const i = this.deck.index();
    return i >= item.index && i < item.index + item.count;
  }

  protected pickSection(s: ContentsSection): void {
    this.override.update((o) => ({ ...o, [s.name]: true }));
    this.deck.goTo(s.firstIndex);
    this.picked.emit();
  }

  protected go(item: ContentsItem): void {
    this.deck.goTo(item.index);
    this.picked.emit();
  }

  protected number(name: string): string {
    const m = /^(\d+)\.\s/.exec(name);
    return m ? m[1].padStart(2, '0') : '';
  }

  protected label(name: string): string {
    return name.replace(/^\d+\.\s*/, '');
  }

  protected isMine(name: string): boolean {
    const mine = this.tool.selected();
    return !!mine && TOOLS.find((t) => t.id === mine)?.section === name;
  }
}
