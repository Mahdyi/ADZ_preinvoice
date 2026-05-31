import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Customer } from '../../../customers/models/customer.model';

@Component({
  selector: 'app-buyer-info-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
  ],
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

  get customerAutocompleteValue(): string | Customer {
    return this.selectedCustomer ?? this.customerQuery;
  }

  completeCustomer(event: AutoCompleteCompleteEvent): void {
    this.customerQueryChange.emit(event.query);
  }

  handleCustomerKeyUp(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement | null;

    if (input) {
      this.customerQueryChange.emit(input.value);
    }
  }

  updateCustomerQuery(value: string | Customer): void {
    if (typeof value === 'string') {
      this.customerQueryChange.emit(value);
      return;
    }

    if (value) {
      this.customerSelected.emit(value);
    }
  }

  selectCustomer(event: { value: Customer | string }): void {
    const customer =
      typeof event.value === 'string'
        ? this.customerOptions.find((option) => option.title === event.value)
        : event.value;

    if (customer) {
      this.customerSelected.emit(customer);
    }
  }

  selectMatchingCustomerQuery(): void {
    if (this.selectedCustomer) {
      return;
    }

    const customer = this.customerOptions.find(
      (option) =>
        this.normalizedText(option.title) ===
        this.normalizedText(this.customerQuery),
    );

    if (customer) {
      this.customerSelected.emit(customer);
    }
  }

  private normalizedText(value: string): string {
    return value.trim().replaceAll('ك', 'ک').replaceAll('ي', 'ی');
  }
}
