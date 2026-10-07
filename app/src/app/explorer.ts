import { Injectable, signal } from '@angular/core';
import { ToolId } from './tools';

export interface ExplorerItem {
  tool: ToolId;
  kind: 'shortcut' | 'command';
  group: string;
  keys: string;
  keysHtml: string;
  action: string;
}

export interface ExplorerFilter {
  tools: Set<ToolId>;
  kind: 'all' | 'shortcut' | 'command';
  query: string;
  /** Show this tool's entries first. */
  first?: ToolId | null;
}

export function filterExplorer(items: ExplorerItem[], f: ExplorerFilter): ExplorerItem[] {
  const words = f.query.toLowerCase().split(/\s+/).filter(Boolean);
  const out = items.filter((i) => {
    if (f.tools.size > 0 && !f.tools.has(i.tool)) return false;
    if (f.kind !== 'all' && i.kind !== f.kind) return false;
    const hay = `${i.keys} ${i.action} ${i.group}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  if (!f.first) return out;
  // Stable partition: the chosen tool first, everything else in its original order.
  return [...out.filter((i) => i.tool === f.first), ...out.filter((i) => i.tool !== f.first)];
}

/** Holds the shortcut and command data generated from the deck's own tables. */
@Injectable({ providedIn: 'root' })
export class ExplorerService {
  readonly items = signal<ExplorerItem[]>([]);

  async loadFromUrl(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (response.ok) this.items.set((await response.json()) as ExplorerItem[]);
    } catch {
      // The explorer is optional; the rest of the app works without it.
    }
  }
}
