import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EquipmentReceiptHeader } from '../../models/equipment-receipt.model';

@Component({
  selector: 'app-equipment-receipt-header-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipment-receipt-header-form.component.html',
  styleUrl: './equipment-receipt-header-form.component.css',
})
export class EquipmentReceiptHeaderFormComponent {
  @Input({ required: true }) header!: EquipmentReceiptHeader;
}
