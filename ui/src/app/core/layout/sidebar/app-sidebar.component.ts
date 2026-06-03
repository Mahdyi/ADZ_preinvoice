import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_MENU } from '../menu/app-menu.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css',
})
export class AppSidebarComponent {
  readonly menu = APP_MENU;
}
