import { Injectable, computed, inject, signal } from '@angular/core';
import { DeckService } from './deck.service';
import { ToolId, ToolInfo, TOOLS, isToolId, toolById } from './tools';

const KEY = 'deck-tool';

/** The reader's chosen tool. It tints the interface and highlights that tool's columns. */
@Injectable({ providedIn: 'root' })
export class ToolService {
  private readonly deck = inject(DeckService);

  readonly selected = signal<ToolId | null>(this.initial());
  readonly info = computed<ToolInfo | null>(() => (this.selected() ? toolById(this.selected()!) : null));
  readonly tools = TOOLS;

  constructor() {
    this.apply(this.selected());
  }

  select(id: ToolId | null): void {
    this.selected.set(id);
    this.apply(id);
    try {
      if (id) localStorage.setItem(KEY, id);
      else localStorage.removeItem(KEY);
    } catch {
      // Storage can be blocked; the choice just won't persist.
    }
  }

  /** Jump to the first slide of the selected tool's section. */
  jumpToMine(): void {
    const info = this.info();
    if (info) this.deck.goToSection(info.section);
  }

  private initial(): ToolId | null {
    try {
      const stored = localStorage.getItem(KEY);
      return isToolId(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  private apply(id: ToolId | null): void {
    if (id) document.documentElement.dataset['tool'] = id;
    else delete document.documentElement.dataset['tool'];
  }
}
