import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GuideBlock } from './guide.model';
import { GuideService, rankTools } from './guide.service';

@Component({
  selector: 'app-guide-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guide-page.html',
  styleUrl: './guide-page.scss',
})
export class GuidePage {
  protected readonly guide = inject(GuideService);
  protected readonly picked = signal<string[]>([]);
  protected readonly copied = signal<string | null>(null);

  protected readonly ranked = computed(() => rankTools(this.guide.data()?.toolFit ?? [], this.picked()));

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
