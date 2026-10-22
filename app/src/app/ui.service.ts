import { Injectable, signal } from '@angular/core';

/** Which overlays and panels are open. Shared by the shell, the palette and the explorer. */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly sidebarOpen = signal(false);
  readonly helpOpen = signal(false);
  readonly paletteOpen = signal(false);
  readonly explorerOpen = signal(false);

  anyDialogOpen(): boolean {
    return this.helpOpen() || this.paletteOpen() || this.explorerOpen();
  }

  closeAll(): void {
    this.helpOpen.set(false);
    this.paletteOpen.set(false);
    this.explorerOpen.set(false);
    this.sidebarOpen.set(false);
  }

  openPalette(): void {
    this.explorerOpen.set(false);
    this.helpOpen.set(false);
    this.paletteOpen.set(true);
  }

  openExplorer(): void {
    this.paletteOpen.set(false);
    this.helpOpen.set(false);
    this.explorerOpen.set(true);
  }

  openHelp(): void {
    this.paletteOpen.set(false);
    this.explorerOpen.set(false);
    this.helpOpen.set(true);
  }
}
