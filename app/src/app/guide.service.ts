import { Injectable, computed, signal } from '@angular/core';
import { GuideData, GuideSection, GuideToolFit, RankedTool } from './guide.model';

const PREFIX = '#/guide';

/** Which guide section a hash points at: "#/guide/safeguards" gives "safeguards", "#/guide" gives null. */
export function guideIdFromHash(hash: string): string | null {
  if (!hash.startsWith(`${PREFIX}/`)) return null;
  return decodeURIComponent(hash.slice(PREFIX.length + 1)) || null;
}

/** Rank tools by how many of the picked needs they match; ties fall back to name order. */
export function rankTools(tools: GuideToolFit[], picked: string[]): RankedTool[] {
  return tools
    .map((t) => ({ ...t, hits: t.needs.filter((n) => picked.includes(n)) }))
    .sort((a, b) => b.hits.length - a.hits.length || a.name.localeCompare(b.name));
}

/** The vendor-neutral guide (pick a tool, IT review, safeguards, profiles), kept in the URL as #/guide/<section>. */
@Injectable({ providedIn: 'root' })
export class GuideService {
  readonly data = signal<GuideData | null>(null);
  private readonly hash = signal(window.location.hash);

  readonly sections = computed(() => this.data()?.sections ?? []);
  readonly groups = computed(() => {
    const groups: { name: string; sections: GuideSection[] }[] = [];
    for (const s of this.sections()) {
      const last = groups[groups.length - 1];
      if (last?.name === s.group) last.sections.push(s);
      else groups.push({ name: s.group, sections: [s] });
    }
    return groups;
  });
  /** Null means the guide's welcome page. */
  readonly current = computed(() => {
    const id = guideIdFromHash(this.hash());
    return this.sections().find((s) => s.id === id) ?? null;
  });
  readonly neighbours = computed(() => {
    const all = this.sections();
    const i = all.findIndex((s) => s.id === this.current()?.id);
    return { prev: i > 0 ? all[i - 1] : null, next: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
  });

  constructor() {
    window.addEventListener('hashchange', () => this.hash.set(window.location.hash));
  }

  href(id: string | null): string {
    return id ? `${PREFIX}/${id}` : PREFIX;
  }

  show(id: string | null): void {
    window.location.hash = this.href(id);
    this.hash.set(window.location.hash);
  }

  async loadFromUrl(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (response.ok) this.data.set((await response.json()) as GuideData);
    } catch {
      // The guide page shows a short message if this is missing; the deck does not depend on it.
    }
  }
}
