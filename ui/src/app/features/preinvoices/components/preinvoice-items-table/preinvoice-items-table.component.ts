import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EquipmentCatalogItem } from '../../../equipment/models/equipment.model';
import { InvoiceRow } from '../../models/preinvoice.model';
import { PreinvoiceItemRowComponent } from '../preinvoice-item-row/preinvoice-item-row.component';

export interface EquipmentSelectedEvent {
  row: InvoiceRow;
  item: EquipmentCatalogItem;
}

@Component({
  selector: 'app-preinvoice-items-table',
  standalone: true,
  imports: [CommonModule, PreinvoiceItemRowComponent],
  templateUrl: './preinvoice-items-table.component.html',
  styleUrl: './preinvoice-items-table.component.css',
})
export class PreinvoiceItemsTableComponent {
  @Input() rows: InvoiceRow[] = [];
  @Input() rowTotal: (row: InvoiceRow) => number = () => 0;

  @Output() newEquipmentRequested = new EventEmitter<void>();
  @Output() equipmentSearch = new EventEmitter<InvoiceRow>();
  @Output() equipmentSelected = new EventEmitter<EquipmentSelectedEvent>();
  @Output() createEquipment = new EventEmitter<InvoiceRow>();
  @Output() addRowRequested = new EventEmitter<void>();
  @Output() removeRowRequested = new EventEmitter<number>();

  isEmptyPrintRow(row: InvoiceRow): boolean {
    return (
      !row.description.trim() &&
      !row.note.trim() &&
      !row.equipmentQuery.trim()
    );
  }
}
