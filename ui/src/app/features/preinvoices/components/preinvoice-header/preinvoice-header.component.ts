import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-preinvoice-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preinvoice-header.component.html',
  styleUrl: './preinvoice-header.component.css',
})
export class PreinvoiceHeaderComponent {
  @Input() preinvoiceNumber = '';
  @Input() issueDate = '';
  @Input() sellerText = '';
  @Input() socialText = '';
  @Input() editable = true;

  @Output() preinvoiceNumberChange = new EventEmitter<string>();
  @Output() issueDateChange = new EventEmitter<string>();
}
