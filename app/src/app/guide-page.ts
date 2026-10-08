import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GuideBlock } from './guide.model';
import { GuideService, rankTools } from './guide.service';
import { GUIDE_TO_DECK, toolForGuideId } from './related';
import { ToolService } from './tool.service';

@Component({
  selector: 'app-guide-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guide-page.html',
  styleUrl: './guide-page.scss',
})
export class GuidePage {
  protected readonly guide = inject(GuideService);
  protected readonly tool = inject(ToolService);
  protected readonly picked = signal<string[]>([]);
  protected readonly copied = signal<string | null>(null);

  protected readonly ranked = computed(() => rankTools(this.guide.data()?.toolFit ?? [], this.picked()));

  /** The deck address for the slide that covers the open chapter in depth, if there is one. */
  protected readonly deckHref = computed(() => {
    const slide = GUIDE_TO_DECK[this.guide.current()?.id ?? ''];
    return slide ? `#/${slide}` : null;
  });

  /** True when this guide chapter is the profile of the agent the reader picked. */
  protected isMine(id: string): boolean {
    const tool = toolForGuideId(id);
    return tool !== null && this.tool.selected() === tool;
  }

  protected toggle(id: string): void {
    this.picked.update((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  protected needLabel(id: string): string {
    return this.guide.data()?.needs.find((n) => n.id === id)?.label ?? id;
  }

  protected needLabels(ids: string[]): string {
    return ids.map((id) => this.needLabel(id)).join(' / ');
  }

  protected blockId(block: GuideBlock): string {
    return block.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  protected async copy(key: string, code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.copied.set(key);
      setTimeout(() => this.copied.set(null), 1500);
    } catch {
      // Clipboard can be blocked; the text is still selectable.
    }
  }
}
