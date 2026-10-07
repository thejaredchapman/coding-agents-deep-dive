import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { DeckService } from './deck.service';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      @for (s of deck.sections(); track s.name) {
        <li>
          <button type="button" [class.active]="s.name === deck.currentSection()" [attr.aria-current]="s.name === deck.currentSection() ? 'true' : null" (click)="pick(s.name)">
            <span class="name">{{ s.name }}</span>
            <span class="count">{{ s.count }}</span>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; }
    button {
      display: flex; width: 100%; justify-content: space-between; gap: 0.5rem; align-items: baseline;
      padding: 0.5rem 0.75rem; border: 0; border-left: 3px solid transparent; background: none;
      color: var(--text); font: inherit; font-size: 0.9rem; text-align: left; cursor: pointer;
    }
    button:hover { background: var(--hover); }
    button.active { border-left-color: var(--accent); background: var(--hover); font-weight: 600; }
    .count { color: var(--muted); font-size: 0.8rem; font-variant-numeric: tabular-nums; }
  `,
})
export class Sidebar {
  protected readonly deck = inject(DeckService);
  readonly picked = output<void>();

  protected pick(name: string): void {
    this.deck.goToSection(name);
    this.picked.emit();
  }
}
