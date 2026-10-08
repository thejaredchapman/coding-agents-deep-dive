import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { DeckService } from './deck.service';

export type Page = 'deck' | 'providers' | 'learn';

/** Which page is showing, kept in the URL hash: #/12 is a slide, #/providers and #/learn are pages. */
@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly deck = inject(DeckService);
  readonly page = signal<Page>(this.fromHash());

  constructor() {
    window.addEventListener('hashchange', () => this.page.set(this.fromHash()));
    // Any slide navigation (search result, sidebar, "my tool") brings the deck back into view.
    effect(() => {
      if (this.deck.navigations() > 0) untracked(() => this.page.set('deck'));
    });
  }

  /** The address for a page; the deck's address is its current slide. */
  href(page: Page): string {
    return page === 'deck' ? `#/${this.deck.index() + 1}` : `#/${page}`;
  }

  show(page: Page): void {
    window.location.hash = this.href(page);
    this.page.set(page);
  }

  private fromHash(): Page {
    const hash = window.location.hash;
    if (hash === '#/providers') return 'providers';
    if (hash === '#/learn') return 'learn';
    return 'deck';
  }
}
