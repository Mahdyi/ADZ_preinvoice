import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly sidebarOpenState = signal(true);

  readonly sidebarOpen = this.sidebarOpenState.asReadonly();

  toggleSidebar(): void {
    this.sidebarOpenState.update((isOpen) => !isOpen);
  }

  closeSidebar(): void {
    this.sidebarOpenState.set(false);
  }
}
