import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { DeckService } from './deck.service';
import { ExplorerService } from './explorer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => Promise.all([inject(DeckService).loadFromUrl('slides.json'), inject(ExplorerService).loadFromUrl('explorer.json')])),
  ],
};
