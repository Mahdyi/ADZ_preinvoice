import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavbarComponent } from './shared/components/app-navbar/app-navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppNavbarComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}
