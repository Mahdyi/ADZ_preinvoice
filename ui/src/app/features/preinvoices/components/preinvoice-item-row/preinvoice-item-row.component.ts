import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EquipmentCatalogItem } from '../../../equipment/models/equipment.model';
import { InvoiceRow } from '../../models/preinvoice.model';

@Component({
  selector: 'app-preinvoice-item-row',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preinvoice-item-row.component.html',
  styleUrl: './preinvoice-item-row.component.css',
})
export class PreinvoiceItemRowComponent {
  @Input({ required: true }) row!: InvoiceRow;
  //Parent, give me the actual row data.
  @Input({ required: true }) index!: number;
  //Parent tell me which row I am.
  @Input() isLast = false;
  @Input() lineTotal = 0;
  //Parent, give me the calculated total for this row.

  @Output() equipmentSearch = new EventEmitter<InvoiceRow>();
  //Parent, the user typed something in the equipment name input, please search equipment for this row.
  @Output() equipmentSelected = new EventEmitter<EquipmentCatalogItem>();
  //Parent, the user selected an equipment from the dropdown, please update this row with the equipment data.
  @Output() createEquipment = new EventEmitter<InvoiceRow>();
  //Parent, the user wants to add this equipment to the equipment database.
  @Output() addRowRequested = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();

  updateEquipmentQuery(value: string): void {
    this.row.equipmentQuery = value;
    this.row.description = value;
    this.equipmentSearch.emit(this.row);
  }

  formatMoney(value: number | string): string {
    return new Intl.NumberFormat('fa-IR').format(
      Math.round(Number(value) || 0),
    );
  }
}
