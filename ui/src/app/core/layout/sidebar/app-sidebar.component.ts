import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_MENU } from '../menu/app-menu.model';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css',
})
export class AppSidebarComponent {
  private readonly layout = inject(LayoutService);
  private closeTimer: number | null = null;

  readonly menu = APP_MENU;

  closeAfterSelection(): void {
    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
    }

    this.closeTimer = window.setTimeout(() => {
      this.layout.closeSidebar();
      this.closeTimer = null;
    }, 320);
  }
}
