import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { DeckService } from './deck.service';
import { ToolService } from './tool.service';
import { TOOLS } from './tools';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      @for (s of deck.sections(); track s.name; let last = $last) {
        <li>
          <button type="button" [class.active]="s.name === deck.currentSection()" [class.mine]="isMine(s.name)" [attr.aria-current]="s.name === deck.currentSection() ? 'true' : null" (click)="pick(s.name)">
            <span class="branch" aria-hidden="true">{{ last ? '└' : '├' }}</span>
            <span class="num">{{ number(s.name) }}</span>
            <span class="name">{{ label(s.name) }}@if (isMine(s.name)) { <span class="you" aria-label="your agent">{{ tool.info()!.glyph }}</span> }</span>
            <span class="count">{{ s.count }}</span>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0 0.4rem; }
    button {
      display: grid; grid-template-columns: 0.9rem 1.5rem 1fr auto; gap: 0.3rem; width: 100%; align-items: baseline;
      padding: 0.42rem 0.55rem; border: 0; border-radius: 6px; background: none; color: var(--ink);
      font: 0.88rem var(--sans); text-align: left;
    }
    button:hover { background: var(--hover); }
    button.active { background: color-mix(in srgb, var(--accent) 15%, transparent); font-weight: 600; }
    button.active .branch { color: var(--accent); }
    .branch, .num, .count { font: 0.7rem var(--mono); color: var(--muted); }
    .count { font-variant-numeric: tabular-nums; }
    .you { margin-left: 0.4em; color: var(--accent); font-size: 0.85em; }
    button.mine .name { color: var(--accent); }
  `,
})
export class Sidebar {
  protected readonly deck = inject(DeckService);
  protected readonly tool = inject(ToolService);
  readonly picked = output<void>();

  protected pick(name: string): void {
    this.deck.goToSection(name);
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
