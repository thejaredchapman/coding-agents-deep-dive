import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { useDialogFocus } from './dialog-focus';
import { ExplorerItem, ExplorerService, filterExplorer } from './explorer';
import { ToolService } from './tool.service';
import { TOOLS, ToolId, toolById } from './tools';
import { UiService } from './ui.service';

interface ToolBlock {
  tool: ToolId;
  name: string;
  glyph: string;
  groups: { name: string; items: ExplorerItem[] }[];
}

@Component({
  selector: 'app-explorer-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explorer-view.html',
  styleUrl: './explorer-view.scss',
})
export class ExplorerView {
  protected readonly ui = inject(UiService);
  protected readonly tool = inject(ToolService);
  private readonly explorer = inject(ExplorerService);
  private readonly trap = useDialogFocus();

  protected readonly tools = TOOLS;
  protected readonly toolFilter = signal<ReadonlySet<ToolId>>(new Set());
  protected readonly kind = signal<'all' | 'shortcut' | 'command'>('all');
  protected readonly query = signal('');
  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly results = computed(() =>
    filterExplorer(this.explorer.items(), {
      tools: new Set(this.toolFilter()),
      kind: this.kind(),
      query: this.query(),
      first: this.tool.selected(),
    }),
  );

  protected readonly blocks = computed<ToolBlock[]>(() => {
    const out: ToolBlock[] = [];
    for (const item of this.results()) {
      let block = out.find((b) => b.tool === item.tool);
      if (!block) {
        const info = toolById(item.tool);
        block = { tool: item.tool, name: info.name, glyph: info.glyph, groups: [] };
        out.push(block);
      }
      let group = block.groups.find((g) => g.name === item.group);
      if (!group) {
        group = { name: item.group, items: [] };
        block.groups.push(group);
      }
      group.items.push(item);
    }
    return out;
  });

  protected readonly showsCodex = computed(() => this.toolFilter().size === 0 || this.toolFilter().has('codex'));

  constructor() {
    afterNextRender(() => this.search()?.nativeElement.focus());
  }

  protected toggleTool(id: ToolId): void {
    const next = new Set(this.toolFilter());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.toolFilter.set(next);
  }

  protected onKey(event: KeyboardEvent, dialog: HTMLElement): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.ui.explorerOpen.set(false);
    } else {
      this.trap(event, dialog);
    }
  }
}
