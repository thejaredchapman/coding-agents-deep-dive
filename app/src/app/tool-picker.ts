import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ToolService } from './tool.service';
import { ToolId } from './tools';

@Component({
  selector: 'app-tool-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="picker" [class.large]="large()" role="group" [attr.aria-label]="label()">
      @for (t of tool.tools; track t.id) {
        <button type="button" class="chip" [attr.data-t]="t.id" [attr.aria-pressed]="tool.selected() === t.id" (click)="toggle(t.id)">
          <span class="glyph" aria-hidden="true">{{ t.glyph }}</span>{{ t.name }}
        </button>
      }
      <button type="button" class="chip all" [attr.aria-pressed]="tool.selected() === null" (click)="tool.select(null)">All</button>
    </div>
  `,
  styleUrl: './tool-picker.scss',
})
export class ToolPicker {
  protected readonly tool = inject(ToolService);
  readonly large = input(false);
  readonly label = input('Your coding agent');

  protected toggle(id: ToolId): void {
    this.tool.select(this.tool.selected() === id ? null : id);
  }
}
