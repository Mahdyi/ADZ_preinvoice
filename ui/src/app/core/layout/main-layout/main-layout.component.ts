import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent } from '../sidebar/app-sidebar.component';
import { AppTopbarComponent } from '../topbar/app-topbar.component';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, AppSidebarComponent, AppTopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private readonly layout = inject(LayoutService);
  readonly sidebarOpen = this.layout.sidebarOpen;

  toggleSidebar(): void {
    this.layout.toggleSidebar();
  }
}
