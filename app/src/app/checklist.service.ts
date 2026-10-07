import { Injectable, signal } from '@angular/core';

const KEY = 'deck-checklists-v1';

type State = Record<string, boolean[]>;

/** Per-exercise checklist progress, kept in localStorage when available and in memory otherwise. */
@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private readonly state = signal<State>(this.load());

  isChecked(exercise: string, index: number): boolean {
    return this.state()[exercise]?.[index] === true;
  }

  doneCount(exercise: string): number {
    return (this.state()[exercise] ?? []).filter(Boolean).length;
  }

  toggle(exercise: string, index: number): void {
    const items = [...(this.state()[exercise] ?? [])];
    items[index] = !items[index];
    this.update({ ...this.state(), [exercise]: items });
  }

  reset(exercise: string): void {
    const { [exercise]: _removed, ...rest } = this.state();
    this.update(rest);
  }

  private update(next: State): void {
    this.state.set(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // keep working in memory
    }
  }

  private load(): State {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as State) : {};
    } catch {
      return {};
    }
  }
}
