import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../../customers/models/customer.model';

@Component({
  selector: 'app-buyer-info-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buyer-info-form.component.html',
  styleUrl: './buyer-info-form.component.css',
})
export class BuyerInfoFormComponent {
  @Input() customerQuery = '';
  //The parent owns this value and gives it to the child.
  @Input() selectedCustomer: Customer | null = null;
  // A customer that the user has already selected.
  @Input() customerOptions: Customer[] = [];
  //This is the list of search results. What customer should I show in the dropdown?

  @Output() customerQueryChange = new EventEmitter<string>();
  @Output() searchRequested = new EventEmitter<void>();
  @Output() customerSelected = new EventEmitter<Customer>();
  @Output() createRequested = new EventEmitter<void>();
}
