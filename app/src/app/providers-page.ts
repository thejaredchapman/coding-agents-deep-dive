import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageService } from './page.service';
import { ProviderLink } from './providers.model';
import { ProvidersService } from './providers.service';
import { ToolService } from './tool.service';
import { ToolId, toolById } from './tools';

const KIND_LABEL: Record<ProviderLink['kind'], string> = { product: 'product', docs: 'docs', code: 'source', company: 'company' };

@Component({
  selector: 'app-providers-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './providers-page.html',
  styleUrl: './reference-page.scss',
})
export class ProvidersPage {
  protected readonly data = inject(ProvidersService);
  protected readonly tool = inject(ToolService);
  protected readonly pages = inject(PageService);

  protected glyph(id: ToolId): string {
    return toolById(id).glyph;
  }

  protected kind(link: ProviderLink): string {
    return KIND_LABEL[link.kind];
  }

  protected hasLearning(id: ToolId): boolean {
    return this.data.learningFor(id).length > 0;
  }
}
