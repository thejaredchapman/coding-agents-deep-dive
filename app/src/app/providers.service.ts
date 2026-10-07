import { Injectable, computed, signal } from '@angular/core';
import { LearningProgram, ProvidersData } from './providers.model';
import { ToolId } from './tools';

/** The providers and free-learning data shown on the two reference pages. */
@Injectable({ providedIn: 'root' })
export class ProvidersService {
  readonly data = signal<ProvidersData | null>(null);
  readonly providers = computed(() => this.data()?.providers ?? []);
  readonly checked = computed(() => this.data()?.checked ?? '');

  learningFor(id: ToolId): LearningProgram[] {
    return (this.data()?.learning ?? []).filter((l) => l.provider === id);
  }

  async loadFromUrl(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (response.ok) this.data.set((await response.json()) as ProvidersData);
    } catch {
      // The pages show a short message if this is missing; the deck itself does not depend on it.
    }
  }
}
