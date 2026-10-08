import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { DeckService } from './deck.service';
import { ExplorerService } from './explorer';
import { GuideService } from './guide.service';
import { ProvidersService } from './providers.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() =>
      Promise.all([
        inject(DeckService).loadFromUrl('slides.json'),
        inject(ExplorerService).loadFromUrl('explorer.json'),
        inject(ProvidersService).loadFromUrl('providers.json'),
        inject(GuideService).loadFromUrl('guide.json'),
      ]),
    ),
  ],
};
