import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NEEDS, TOOL_FIT, rankTools } from './needs-picker.data';
import { ToolService } from './tool.service';
import { ToolId } from './tools';

/** The deck's tool ids mapped to this picker's ids. */
const PICKER_ID: Record<ToolId, string> = { claude: 'claude-code', codex: 'codex', cursor: 'cursor', gemini: 'gemini-cli', copilot: 'copilot', devin: 'windsurf', aider: 'aider' };

@Component({
  selector: 'app-needs-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="needs" role="group" aria-label="What matters to you">
      @for (n of needs; track n.id) {
        <label [class.on]="picked().includes(n.id)">
          <input type="checkbox" [checked]="picked().includes(n.id)" (change)="toggle(n.id)" />
          <span>{{ n.label }}</span>
        </label>
      }
    </div>
    <ol class="ranked" aria-live="polite">
      @for (t of ranked(); track t.id) {
        <li [class.dim]="picked().length > 0 && t.hits.length === 0">
          <span class="name">{{ t.name }}@if (isMine(t.id)) { <span class="you">your agent</span> }</span>
          <span class="score">{{ t.hits.length }}/{{ picked().length || '–' }}</span>
          @if (picked().length > 0) {
            <span class="meter" aria-hidden="true"><span [style.width.%]="(t.hits.length / picked().length) * 100"></span></span>
            <span class="why">{{ t.hits.length ? 'matches: ' + labels(t.hits) : 'no matches' }}</span>
          }
        </li>
      }
    </ol>
  `,
  styles: `
    :host { display: block; margin: 0 0 1.2rem; }
    .needs { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: 0.5rem; margin: 0 0 1rem; }
    label { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.55rem 0.7rem; border: 1px solid var(--rule); border-radius: 6px; cursor: pointer; font-size: 0.9rem; background: var(--raised); }
    label.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--raised)); }
    input { margin-top: 0.2rem; accent-color: var(--accent); }
    .ranked { list-style: none; margin: 0; padding: 0; border: 1px solid var(--rule); border-radius: 8px; }
    li { display: grid; grid-template-columns: 1fr auto; gap: 0.2rem 0.8rem; margin: 0; padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--rule); }
    li:last-child { border-bottom: 0; }
    li.dim { opacity: 0.6; }
    .name { font-weight: 700; color: var(--accent); }
    .score { font: 0.8rem var(--mono); color: var(--muted); }
    .meter { grid-column: 1 / -1; height: 5px; border-radius: 3px; background: var(--rule); overflow: hidden; }
    .meter > span { display: block; height: 100%; background: var(--accent); }
    .why { grid-column: 1 / -1; font-size: 0.78rem; color: var(--muted); }
    .you { margin-left: 0.5rem; padding: 0.05em 0.45em; border: 1px solid var(--accent); border-radius: 4px; font: 600 0.62rem var(--mono); }
  `,
})
export class NeedsPicker {
  private readonly tool = inject(ToolService);
  protected readonly needs = NEEDS;
  protected readonly picked = signal<string[]>([]);
  protected readonly ranked = computed(() => rankTools(TOOL_FIT, this.picked()));

  protected toggle(id: string): void {
    this.picked.update((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  protected labels(ids: string[]): string {
    return ids.map((id) => NEEDS.find((n) => n.id === id)?.label ?? id).join(' / ');
  }

  protected isMine(id: string): boolean {
    const mine = this.tool.selected();
    return mine !== null && PICKER_ID[mine] === id;
  }
}
