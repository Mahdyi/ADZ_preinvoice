import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    ToolbarModule,
  ],
  templateUrl: './app-navbar.component.html',
  styleUrl: './app-navbar.component.css',
})
export class AppNavbarComponent {}
