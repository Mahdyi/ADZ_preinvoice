import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { finalize, firstValueFrom } from 'rxjs';
import {
  emptyEquipmentReceiptDraft,
  emptyEquipmentReceiptRow,
  EquipmentReceiptDraft,
  EquipmentReceiptItem,
  EquipmentReceiptItemDraft,
  EquipmentReceiptLookupOption,
  EquipmentReceiptRecord,
  EquipmentReceiptRecordDraft,
  EquipmentReceiptRow,
} from '../../models/equipment-receipt.model';
import { EquipmentReceiptApiService } from '../../services/equipment-receipt-api.service';
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
export class EquipmentReceiptPageComponent implements OnInit {
  receipt: EquipmentReceiptDraft = emptyEquipmentReceiptDraft(1);
  receiptId: number | null = null;
  message = '';
  error = '';
  saving = false;
  loadingReceipt = false;

  constructor(
    private readonly receipts: EquipmentReceiptApiService,
    private readonly lookup: EquipmentReceiptLookupService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const editId = Number(
      new URLSearchParams(window.location.search).get('receiptId'),
    );

    if (editId) {
      this.loadReceiptForEdit(editId);
    }
  }

  get isEditMode(): boolean {
    return this.receiptId !== null;
  }

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
    this.receiptId = null;
    this.receipt = emptyEquipmentReceiptDraft(1);
    this.error = '';
    this.message = 'رسید جدید آماده شد.';
    window.history.replaceState(null, '', '/equipment-receipt');
  }

  saveReceipt(): void {
    this.message = '';
    this.error = '';

    const items = this.collectItems();
    if (!items.length) {
      this.error = 'حداقل یک ردیف تجهیز وارد کنید.';
      return;
    }

    this.saving = true;
    const receipt = this.receiptToRecordDraft();
    const request = this.receiptId
      ? this.receipts.updateWithItems(this.receiptId, receipt, items)
      : this.receipts.createWithItems(receipt, items);

    const wasEditing = this.isEditMode;
    request
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (saved) => {
          this.receiptId = saved.id;
          window.history.replaceState(
            null,
            '',
            `/equipment-receipt?receiptId=${saved.id}`,
          );
          this.message = wasEditing
            ? 'رسید با موفقیت به‌روزرسانی شد.'
            : 'رسید با موفقیت ذخیره شد.';
          this.cdr.detectChanges();
        },
        error: () => {
          this.error =
            'ذخیره رسید انجام نشد. اگر این اولین اجرای این نسخه است، جدول‌های رسید تجهیزات را در دیتابیس اعمال کنید.';
          this.cdr.detectChanges();
        },
      });
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

  private async loadReceiptForEdit(id: number): Promise<void> {
    this.loadingReceipt = true;
    this.error = '';

    try {
      const [receipts, items] = await Promise.all([
        firstValueFrom(this.receipts.get(id)),
        firstValueFrom(this.receipts.listItems(id)),
      ]);
      const receipt = receipts[0];

      if (!receipt) {
        this.error = 'رسید انتخاب شده پیدا نشد.';
        return;
      }

      this.receiptId = receipt.id;
      this.receipt = {
        header: this.recordToHeader(receipt),
        rows: items.length
          ? items.map((item) => this.itemToRow(item))
          : [emptyEquipmentReceiptRow()],
      };
    } catch {
      this.error = 'دریافت اطلاعات رسید برای ویرایش انجام نشد.';
    } finally {
      this.loadingReceipt = false;
      this.cdr.detectChanges();
    }
  }

  private receiptToRecordDraft(): EquipmentReceiptRecordDraft {
    const header = this.receipt.header;

    return {
      acceptance_number: this.nullableText(header.acceptanceNumber),
      receipt_date: header.date || new Date().toISOString().slice(0, 10),
      receipt_time: header.time || new Date().toTimeString().slice(0, 5),
      company: this.nullableText(header.company),
      follow_up_person: this.nullableText(header.followUpPerson),
      phone: this.nullableText(header.phone),
      technical_manager: this.nullableText(header.technicalManager),
      address: this.nullableText(header.address),
      postal_code: this.nullableText(header.postalCode),
      national_id: this.nullableText(header.nationalId),
      technical_manager_phone: this.nullableText(header.technicalManagerPhone),
      status: 'draft',
    };
  }

  private collectItems(): EquipmentReceiptItemDraft[] {
    return this.receipt.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => this.hasMeaningfulRow(row))
      .map(({ row, index }) => ({
        sort_order: index + 1,
        equipment_catalog_id: row.selectedEquipment?.id ?? null,
        equipment_name: (row.equipmentName || row.equipmentQuery).trim(),
        manufacturer: this.nullableText(row.manufacturer),
        model_class: this.nullableText(row.modelClass),
        requested_range: this.nullableText(row.requestedRange),
        notes: this.nullableText(row.notes),
      }));
  }

  private recordToHeader(record: EquipmentReceiptRecord) {
    return {
      acceptanceNumber: record.acceptance_number ?? '',
      date: record.receipt_date,
      time: record.receipt_time?.slice(0, 5) ?? '',
      company: record.company ?? '',
      followUpPerson: record.follow_up_person ?? '',
      phone: record.phone ?? '',
      technicalManager: record.technical_manager ?? '',
      address: record.address ?? '',
      postalCode: record.postal_code ?? '',
      nationalId: record.national_id ?? '',
      technicalManagerPhone: record.technical_manager_phone ?? '',
    };
  }

  private itemToRow(item: EquipmentReceiptItem): EquipmentReceiptRow {
    return {
      equipmentQuery: item.equipment_name,
      equipmentOptions: [],
      selectedEquipment: null,
      equipmentName: item.equipment_name,
      manufacturer: item.manufacturer ?? '',
      modelClass: item.model_class ?? '',
      requestedRange: item.requested_range ?? '',
      notes: item.notes ?? '',
    };
  }

  private hasMeaningfulRow(row: EquipmentReceiptRow): boolean {
    return Boolean(
      (row.equipmentName || row.equipmentQuery).trim() ||
        row.manufacturer.trim() ||
        row.modelClass.trim() ||
        row.requestedRange.trim() ||
        row.notes.trim(),
    );
  }

  private nullableText(value: string): string | null {
    const trimmed = value.trim();
    return trimmed || null;
  }

  private normalizedText(value: string): string {
    return value.trim().replaceAll('ك', 'ک').replaceAll('ي', 'ی');
  }
}
