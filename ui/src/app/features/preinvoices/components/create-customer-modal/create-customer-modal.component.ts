import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CustomerDraft } from '../../../customers/models/customer.model';

@Component({
  selector: 'app-create-customer-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './create-customer-modal.component.html',
  styleUrl: './create-customer-modal.component.css',
})
export class CreateCustomerModalComponent {
  @Input({ required: true }) customer!: CustomerDraft;

  @Output() closeRequested = new EventEmitter<void>();
  @Output() saveRequested = new EventEmitter<void>();
}
