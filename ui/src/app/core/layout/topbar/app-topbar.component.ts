import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './app-topbar.component.html',
  styleUrl: './app-topbar.component.css',
})
export class AppTopbarComponent {
  @Output() readonly menuToggle = new EventEmitter<void>();
}
