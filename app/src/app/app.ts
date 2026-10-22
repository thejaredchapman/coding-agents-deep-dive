import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { CommandPalette } from './command-palette';
import { DeckService } from './deck.service';
import { ExplorerView } from './explorer-view';
import { LearnPage } from './learn-page';
import { PageService } from './page.service';
import { ProvidersPage } from './providers-page';
import { Sidebar } from './sidebar';
import { SlideView } from './slide-view';
import { ThemeService } from './theme.service';
import { ToolPicker } from './tool-picker';
import { ToolService } from './tool.service';
import { UiService } from './ui.service';

const SWIPE_DISTANCE = 50;
const BRAND = 'Coding Agents — Deep Dive';

@Component({
  selector: 'app-root',
  imports: [Sidebar, SlideView, ToolPicker, CommandPalette, ExplorerView, ProvidersPage, LearnPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '(window:keydown)': 'onKey($event)' },
})
export class App {
  protected readonly deck = inject(DeckService);
  protected readonly theme = inject(ThemeService);
  protected readonly tool = inject(ToolService);
  protected readonly ui = inject(UiService);
  protected readonly pages = inject(PageService);

  protected readonly percent = computed(() => Math.round(this.deck.progress() * 100));
  /** Shown in the statusline, like an editor's mode indicator. */
  protected readonly mode = computed(() =>
    this.ui.paletteOpen() ? 'SEARCH' : this.ui.explorerOpen() ? 'EXPLORE' : this.ui.helpOpen() ? 'HELP' : 'NORMAL',
  );
  protected readonly announcement = computed(() => {
    if (this.pages.page() === 'providers') return 'Providers page';
    if (this.pages.page() === 'learn') return 'Free learning page';
    return this.deck.current() ? `Slide ${this.deck.index() + 1} of ${this.deck.total()}: ${this.deck.current().title}` : '';
  });
  protected readonly pageLabel = computed(() => {
    const page = this.pages.page();
    return page === 'providers' ? 'providers' : page === 'learn' ? 'free learning' : this.deck.currentSection();
  });

  private swipeStart: { x: number; y: number } | null = null;

  constructor() {
    effect(() => {
      const page = this.pages.page();
      const slide = this.deck.current();
      if (page === 'providers') document.title = `Providers · ${BRAND}`;
      else if (page === 'learn') document.title = `Free learning · ${BRAND}`;
      else document.title = !slide || slide.title === BRAND ? BRAND : `${slide.title} · ${BRAND}`;
    });
  }

  protected onKey(event: KeyboardEvent): void {
    // Ctrl/Cmd+K opens search from anywhere, even while typing.
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.ui.openPalette();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    // While a dialog is open it owns the keyboard; Escape closes it.
    if (this.ui.anyDialogOpen()) {
      if (event.key === 'Escape') this.ui.closeAll();
      return;
    }

    const target = event.target as HTMLElement;
    if (target.matches('input, textarea, select, [contenteditable]')) return;
    const onControl = !!target.closest('button, a');

    // Page shortcuts work everywhere; slide keys only make sense on the deck, so other pages scroll normally.
    if (event.key === 'p') return this.pages.show('providers');
    if (event.key === 'l') return this.pages.show('learn');
    if (event.key === 'd') return this.pages.show('deck');
    if (this.pages.page() !== 'deck' && ['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', ' ', 'm'].includes(event.key)) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'PageDown':
        this.deck.next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        this.deck.prev();
        break;
      case 'Home':
        this.deck.goTo(0);
        break;
      case 'End':
        this.deck.goTo(this.deck.total() - 1);
        break;
      case ' ':
        if (onControl) return;
        event.shiftKey ? this.deck.prev() : this.deck.next();
        break;
      case '/':
        this.ui.openPalette();
        break;
      case 'e':
        this.ui.openExplorer();
        break;
      case 'm':
        this.tool.jumpToMine();
        return;
      case 't':
        this.theme.toggle();
        return;
      case 's':
        this.ui.sidebarOpen.update((v) => !v);
        return;
      case '?':
        this.ui.openHelp();
        return;
      case 'Escape':
        this.ui.closeAll();
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  protected onPointerDown(event: PointerEvent): void {
    // Don't start a swipe on content that scrolls sideways itself.
    if ((event.target as HTMLElement).closest('pre, table')) return;
    this.swipeStart = { x: event.clientX, y: event.clientY };
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.swipeStart) return;
    const dx = event.clientX - this.swipeStart.x;
    const dy = event.clientY - this.swipeStart.y;
    this.swipeStart = null;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) this.deck.next();
    else this.deck.prev();
  }
}
