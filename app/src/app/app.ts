import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DeckService } from './deck.service';
import { Sidebar } from './sidebar';
import { SlideView } from './slide-view';
import { ThemeService } from './theme.service';

const SWIPE_DISTANCE = 50;

@Component({
  selector: 'app-root',
  imports: [Sidebar, SlideView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '(window:keydown)': 'onKey($event)' },
})
export class App {
  protected readonly deck = inject(DeckService);
  protected readonly theme = inject(ThemeService);
  protected readonly sidebarOpen = signal(false);
  protected readonly helpOpen = signal(false);

  protected readonly percent = computed(() => Math.round(this.deck.progress() * 100));
  protected readonly announcement = computed(() =>
    this.deck.current() ? `Slide ${this.deck.index() + 1} of ${this.deck.total()}: ${this.deck.current().title}` : '',
  );

  private swipeStart: { x: number; y: number } | null = null;

  constructor() {
    effect(() => {
      const slide = this.deck.current();
      document.title = slide ? `${slide.title} · Coding Agents — Deep Dive` : 'Coding Agents — Deep Dive';
    });
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (target.matches('input, textarea, select, [contenteditable]')) return;
    const onControl = !!target.closest('button, a');

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
      case 't':
        this.theme.toggle();
        return;
      case 's':
        this.sidebarOpen.update((v) => !v);
        return;
      case '?':
        this.helpOpen.update((v) => !v);
        return;
      case 'Escape':
        this.helpOpen.set(false);
        this.sidebarOpen.set(false);
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
