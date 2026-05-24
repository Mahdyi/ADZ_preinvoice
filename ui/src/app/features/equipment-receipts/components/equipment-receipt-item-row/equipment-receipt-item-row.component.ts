import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EquipmentReceiptLookupOption,
  EquipmentReceiptRow,
} from '../../models/equipment-receipt.model';

@Component({
  selector: 'app-equipment-receipt-item-row',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipment-receipt-item-row.component.html',
  styleUrl: './equipment-receipt-item-row.component.css',
})
export class EquipmentReceiptItemRowComponent {
  @Input({ required: true }) row!: EquipmentReceiptRow;
  @Input({ required: true }) index!: number;

  @Output() equipmentSearch = new EventEmitter<EquipmentReceiptRow>();
  @Output() equipmentSelected =
    new EventEmitter<EquipmentReceiptLookupOption>();

  updateEquipmentQuery(value: string): void {
    this.row.equipmentQuery = value;
    this.row.equipmentName = value;
    this.row.selectedEquipment = null;
    this.equipmentSearch.emit(this.row);
  }
}
