import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import {
  EquipmentReceiptLookupOption,
  EquipmentReceiptRow,
} from '../../models/equipment-receipt.model';
import { EquipmentReceiptItemRowComponent } from '../equipment-receipt-item-row/equipment-receipt-item-row.component';

export interface ReceiptEquipmentSelectedEvent {
  row: EquipmentReceiptRow;
  option: EquipmentReceiptLookupOption;
}

@Component({
  selector: 'app-equipment-receipt-items-table',
  standalone: true,
  imports: [CommonModule, ButtonModule, EquipmentReceiptItemRowComponent],
  templateUrl: './equipment-receipt-items-table.component.html',
  styleUrl: './equipment-receipt-items-table.component.css',
})
export class EquipmentReceiptItemsTableComponent {
  @Input() rows: EquipmentReceiptRow[] = [];

  @Output() equipmentSearch = new EventEmitter<EquipmentReceiptRow>();
  @Output() equipmentSelected =
    new EventEmitter<ReceiptEquipmentSelectedEvent>();
  @Output() addRowRequested = new EventEmitter<void>();
  @Output() removeRowRequested = new EventEmitter<EquipmentReceiptRow>();
}
