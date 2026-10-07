import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { DeckService } from './deck.service';
import { ToolService } from './tool.service';
import { TOOLS } from './tools';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      @for (s of deck.sections(); track s.name) {
        <li>
          <button type="button" [class.active]="s.name === deck.currentSection()" [class.mine]="isMine(s.name)" [attr.aria-current]="s.name === deck.currentSection() ? 'true' : null" (click)="pick(s.name)">
            <span class="num">{{ number(s.name) }}</span>
            <span class="name">{{ label(s.name) }}@if (isMine(s.name)) { <span class="you" aria-label="your tool">{{ tool.info()!.glyph }}</span> }</span>
            <span class="count">{{ s.count }}</span>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; }
    button {
      display: grid; grid-template-columns: 1.9rem 1fr auto; gap: 0.4rem; width: 100%; align-items: baseline;
      padding: 0.5rem 1rem 0.5rem 0.9rem; border: 0; border-left: 4px solid transparent; border-radius: 0; background: none;
      color: var(--ink); font: 0.95rem var(--serif); letter-spacing: 0; text-align: left; transform: none;
    }
    button:hover { background: var(--hover); transform: none; }
    button.active { border-left-color: var(--accent); background: var(--hover); font-weight: 700; }
    .num { font: 600 0.68rem var(--mono); color: var(--muted); letter-spacing: 0.04em; }
    .count { font: 0.68rem var(--mono); color: var(--muted); font-variant-numeric: tabular-nums; }
    .you { margin-left: 0.4em; color: var(--accent); font-size: 0.8em; }
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
