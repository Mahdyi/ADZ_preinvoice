import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import {
  emptyEquipmentReceiptDraft,
  EquipmentReceiptDraft,
  EquipmentReceiptLookupOption,
  EquipmentReceiptRow,
} from '../../models/equipment-receipt.model';
import { EquipmentReceiptLookupService } from '../../services/equipment-receipt-lookup.service';
import { EquipmentReceiptHeaderFormComponent } from '../../components/equipment-receipt-header-form/equipment-receipt-header-form.component';
import {
  EquipmentReceiptItemsTableComponent,
  ReceiptEquipmentSelectedEvent,
} from '../../components/equipment-receipt-items-table/equipment-receipt-items-table.component';
import { EquipmentReceiptTermsComponent } from '../../components/equipment-receipt-terms/equipment-receipt-terms.component';
import { EquipmentReceiptSignaturesComponent } from '../../components/equipment-receipt-signatures/equipment-receipt-signatures.component';

@Component({
  selector: 'app-equipment-receipt-page',
  standalone: true,
  imports: [
    CommonModule,
    EquipmentReceiptHeaderFormComponent,
    EquipmentReceiptItemsTableComponent,
    EquipmentReceiptTermsComponent,
    EquipmentReceiptSignaturesComponent,
  ],
  templateUrl: './equipment-receipt-page.component.html',
  styleUrl: './equipment-receipt-page.component.css',
})
export class EquipmentReceiptPageComponent {
  receipt: EquipmentReceiptDraft = emptyEquipmentReceiptDraft(5);
  error = '';

  constructor(
    private readonly lookup: EquipmentReceiptLookupService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  searchEquipment(row: EquipmentReceiptRow): void {
    const term = row.equipmentQuery.trim();
    if (!term) {
      row.equipmentOptions = [];
      return;
    }

    this.lookup.search(term).subscribe({
      next: (options) => {
        row.equipmentOptions = options;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'دریافت فهرست تجهیزات انجام نشد.';
        row.equipmentOptions = [];
        this.cdr.detectChanges();
      },
    });
  }

  selectEquipment(event: ReceiptEquipmentSelectedEvent): void {
    this.applyEquipment(event.row, event.option);
  }

  private applyEquipment(
    row: EquipmentReceiptRow,
    option: EquipmentReceiptLookupOption,
  ): void {
    row.selectedEquipment = option;
    row.equipmentName = option.equipmentName;
    row.equipmentQuery = option.equipmentName;
    row.requestedRange =
      option.measurementQuantity && option.measurementQuantity !== '-'
        ? option.measurementQuantity
        : row.requestedRange;
    row.notes = option.location ? `محل: ${option.location}` : row.notes;
    row.equipmentOptions = [];
  }
}
