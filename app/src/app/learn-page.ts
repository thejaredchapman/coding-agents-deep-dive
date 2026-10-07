import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProvidersService } from './providers.service';
import { ToolService } from './tool.service';
import { ToolId, toolById } from './tools';

@Component({
  selector: 'app-learn-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learn-page.html',
  styleUrl: './reference-page.scss',
})
export class LearnPage {
  protected readonly data = inject(ProvidersService);
  protected readonly tool = inject(ToolService);

  protected glyph(id: ToolId): string {
    return toolById(id).glyph;
  }

  protected programs(id: ToolId) {
    return this.data.learningFor(id);
  }
}
