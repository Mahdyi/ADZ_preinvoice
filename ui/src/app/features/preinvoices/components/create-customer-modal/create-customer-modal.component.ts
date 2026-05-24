import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomerDraft } from '../../../customers/models/customer.model';

@Component({
  selector: 'app-create-customer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-customer-modal.component.html',
  styleUrl: './create-customer-modal.component.css',
})
export class CreateCustomerModalComponent {
  @Input({ required: true }) customer!: CustomerDraft;

  @Output() closeRequested = new EventEmitter<void>();
  @Output() saveRequested = new EventEmitter<void>();
}
