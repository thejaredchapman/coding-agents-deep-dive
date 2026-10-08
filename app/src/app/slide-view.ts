import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, afterRenderEffect, computed, inject, viewChild } from '@angular/core';
import { ChecklistService } from './checklist.service';
import { DeckService } from './deck.service';
import { GuideService } from './guide.service';
import { guideIdsForSlide } from './related';
import { DiagramEcosystem, DiagramFlow, DiagramHooks, DiagramSubagents } from './diagrams';
import { slidePath } from './slug';
import { enhanceTables } from './table-enhancer';
import { ToolPicker } from './tool-picker';

@Component({
  selector: 'app-slide-view',
  imports: [DiagramSubagents, DiagramHooks, DiagramFlow, DiagramEcosystem, ToolPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './slide-view.html',
  styleUrl: './slide-view.scss',
})
export class SlideView {
  protected readonly deck = inject(DeckService);
  protected readonly checklist = inject(ChecklistService);
  protected readonly guide = inject(GuideService);
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');

  /** A file-path style breadcrumb such as ~/deep-dive/05-hooks/what-are-hooks.md. */
  protected readonly path = computed(() => {
    const slide = this.deck.current();
    return slide ? slidePath(slide.section, slide.title) : '';
  });

  /** Guide chapters that cover the open slide's topic, so a reader can move from the deck to the guide. */
  protected readonly related = computed(() => {
    const slide = this.deck.current();
    if (!slide) return [];
    const wanted = guideIdsForSlide(slide.id, slide.section);
    return this.guide.sections().filter((s) => wanted.includes(s.id)).map((s) => ({ title: s.title, href: this.guide.href(s.id) }));
  });

  constructor() {
    // Runs after each render: add copy buttons and open external links in a new tab.
    afterRenderEffect(() => {
      this.deck.current();
      this.decorate();
    });
  }

  protected onContentClick(event: MouseEvent): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button.copy');
    if (!button) return;
    const code = button.parentElement?.querySelector('code')?.textContent ?? '';
    void this.copy(code).then((ok) => {
      button.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      setTimeout(() => (button.textContent = 'Copy'), 1500);
    });
  }

  private decorate(): void {
    const root = this.content()?.nativeElement;
    if (!root) return;
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('button.copy')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      pre.appendChild(button);
    });
    enhanceTables(root);
    root.querySelectorAll('a[href^="http"]').forEach((a) => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }

  private async copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      area.remove();
      return ok;
    }
  }
}
