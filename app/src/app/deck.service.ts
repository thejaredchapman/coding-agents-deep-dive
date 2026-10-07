import { Injectable, computed, signal } from '@angular/core';
import { DeckData, SectionInfo, Slide } from './deck.model';

@Injectable({ providedIn: 'root' })
export class DeckService {
  private readonly data = signal<DeckData>({ updated: '', slides: [] });

  readonly slides = computed(() => this.data().slides);
  readonly updated = computed(() => this.data().updated);
  readonly total = computed(() => this.slides().length);
  readonly index = signal(0);
  readonly error = signal<string | null>(null);
  /** 1 after moving forward, -1 after moving back; drives the slide transition direction. */
  readonly direction = signal<1 | -1>(1);
  /** Increments on every navigation, so other services can react to the reader moving through slides. */
  readonly navigations = signal(0);
  readonly current = computed<Slide>(() => this.slides()[this.index()]);
  readonly currentSection = computed(() => this.current()?.section ?? '');
  readonly progress = computed(() => (this.total() > 1 ? this.index() / (this.total() - 1) : 0));

  readonly sections = computed<SectionInfo[]>(() => {
    const out: SectionInfo[] = [];
    this.slides().forEach((slide, i) => {
      const last = out[out.length - 1];
      if (last && last.name === slide.section) last.count++;
      else out.push({ name: slide.section, firstIndex: i, count: 1 });
    });
    return out;
  });

  constructor() {
    window.addEventListener('hashchange', () => {
      const fromHash = this.readHash();
      // Other hashes (#/providers, #/learn) are pages, not slides: leave the position alone.
      if (fromHash !== null && this.total() > 0) this.index.set(this.clamp(fromHash));
    });
  }

  load(data: DeckData): void {
    this.data.set(data);
    this.index.set(this.clamp(this.readHash() ?? 0));
  }

  async loadFromUrl(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.load((await response.json()) as DeckData);
    } catch (e) {
      this.error.set(`Could not load the slides (${url}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  next(): void {
    this.goTo(this.index() + 1);
  }

  prev(): void {
    this.goTo(this.index() - 1);
  }

  goTo(i: number): void {
    const target = this.clamp(i);
    if (target !== this.index()) this.direction.set(target > this.index() ? 1 : -1);
    this.index.set(target);
    this.navigations.update((n) => n + 1);
    this.writeHash();
  }

  goToSection(name: string): void {
    const section = this.sections().find((s) => s.name === name);
    if (section) this.goTo(section.firstIndex);
  }

  private clamp(i: number): number {
    const max = this.total() - 1;
    if (!Number.isFinite(i) || max < 0) return 0;
    return Math.min(Math.max(Math.trunc(i), 0), max);
  }

  /** The URL hash is 1-based (#/12 is slide 12); returns a 0-based index, or null if the hash is not a slide. */
  private readHash(): number | null {
    const match = /^#\/(\d+)$/.exec(window.location.hash);
    return match ? Number(match[1]) - 1 : null;
  }

  private writeHash(): void {
    // replaceState keeps Back from stepping through every slide and does not fire hashchange.
    history.replaceState(null, '', `#/${this.index() + 1}`);
  }
}
