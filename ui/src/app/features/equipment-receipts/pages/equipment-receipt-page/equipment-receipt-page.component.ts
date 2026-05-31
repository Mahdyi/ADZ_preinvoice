import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import {
  emptyEquipmentReceiptDraft,
  emptyEquipmentReceiptRow,
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
    ButtonModule,
    MessageModule,
    EquipmentReceiptHeaderFormComponent,
    EquipmentReceiptItemsTableComponent,
    EquipmentReceiptTermsComponent,
    EquipmentReceiptSignaturesComponent,
  ],
  templateUrl: './equipment-receipt-page.component.html',
  styleUrl: './equipment-receipt-page.component.css',
})
export class EquipmentReceiptPageComponent {
  receipt: EquipmentReceiptDraft = emptyEquipmentReceiptDraft(1);
  message = '';
  error = '';

  constructor(
    private readonly lookup: EquipmentReceiptLookupService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  searchEquipment(row: EquipmentReceiptRow): void {
    this.message = '';
    this.error = '';

    const term = row.equipmentQuery.trim();
    if (!term) {
      row.equipmentOptions = [];
      return;
    }

    this.lookup.search(term).subscribe({
      next: (options) => {
        row.equipmentOptions = options;
        const currentQuery = row.equipmentQuery.trim();
        const exactOption = options.find(
          (option) =>
            this.normalizedText(option.equipmentName) ===
            this.normalizedText(currentQuery),
        );

        if (!row.selectedEquipment && exactOption) {
          this.applyEquipment(row, exactOption);
        }

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
    this.message = '';
    this.error = '';
    this.applyEquipment(event.row, event.option);
  }

  addRow(): void {
    this.message = '';
    this.error = '';
    this.receipt.rows = [...this.receipt.rows, emptyEquipmentReceiptRow()];
  }

  removeRow(row: EquipmentReceiptRow): void {
    this.message = '';
    this.error = '';

    if (this.receipt.rows.length === 1) {
      this.receipt.rows = [emptyEquipmentReceiptRow()];
      return;
    }

    this.receipt.rows = this.receipt.rows.filter(
      (currentRow) => currentRow !== row,
    );
  }

  printReceipt(): void {
    this.message = '';
    this.error = '';
    window.print();
  }

  resetReceipt(): void {
    this.receipt = emptyEquipmentReceiptDraft(1);
    this.error = '';
    this.message = 'رسید جدید آماده شد.';
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

  private normalizedText(value: string): string {
    return value.trim().replaceAll('ك', 'ک').replaceAll('ي', 'ی');
  }
}
