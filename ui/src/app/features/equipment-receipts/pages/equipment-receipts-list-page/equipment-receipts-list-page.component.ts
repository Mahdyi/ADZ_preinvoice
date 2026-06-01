import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { finalize, firstValueFrom, timeout } from 'rxjs';
import { EquipmentReceiptHeaderFormComponent } from '../../components/equipment-receipt-header-form/equipment-receipt-header-form.component';
import { EquipmentReceiptItemsTableComponent } from '../../components/equipment-receipt-items-table/equipment-receipt-items-table.component';
import { EquipmentReceiptSignaturesComponent } from '../../components/equipment-receipt-signatures/equipment-receipt-signatures.component';
import { EquipmentReceiptTermsComponent } from '../../components/equipment-receipt-terms/equipment-receipt-terms.component';
import {
  emptyEquipmentReceiptDraft,
  EquipmentReceiptDraft,
  EquipmentReceiptItem,
  EquipmentReceiptRecord,
  EquipmentReceiptSummary,
  EquipmentReceiptRow,
} from '../../models/equipment-receipt.model';
import { EquipmentReceiptApiService } from '../../services/equipment-receipt-api.service';

@Component({
  selector: 'app-equipment-receipts-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MessageModule,
    TableModule,
    EquipmentReceiptHeaderFormComponent,
    EquipmentReceiptItemsTableComponent,
    EquipmentReceiptTermsComponent,
    EquipmentReceiptSignaturesComponent,
  ],
  templateUrl: './equipment-receipts-list-page.component.html',
  styleUrl: './equipment-receipts-list-page.component.css',
})
export class EquipmentReceiptsListPageComponent implements OnInit {
  receipts: EquipmentReceiptSummary[] = [];
  loading = false;
  error = '';
  printingReceiptId: number | null = null;
  selectedReceipt: EquipmentReceiptDraft | null = null;

  constructor(
    private readonly api: EquipmentReceiptApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadReceipts();
  }

  loadReceipts(): void {
    this.loading = true;
    this.error = '';

    this.api
      .list()
      .pipe(
        timeout(7000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (receipts) => {
          this.receipts = receipts;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error =
            'دریافت لیست رسیدها انجام نشد. اگر این اولین اجرای این نسخه است، جدول‌های رسید تجهیزات را در دیتابیس اعمال کنید.';
          this.cdr.detectChanges();
        },
      });
  }

  editReceipt(receipt: EquipmentReceiptSummary): void {
    window.location.href = `/equipment-receipt?receiptId=${receipt.id}`;
  }

  async printReceipt(receipt: EquipmentReceiptSummary): Promise<void> {
    this.error = '';
    this.printingReceiptId = receipt.id;

    try {
      const [receipts, items] = await Promise.all([
        firstValueFrom(this.api.get(receipt.id)),
        firstValueFrom(this.api.listItems(receipt.id)),
      ]);
      const selected = receipts[0];

      if (!selected) {
        this.error = 'رسید انتخاب شده پیدا نشد.';
        return;
      }

      this.selectedReceipt = {
        header: this.recordToHeader(selected),
        rows: items.length
          ? items.map((item) => this.itemToRow(item))
          : emptyEquipmentReceiptDraft(1).rows,
      };
      this.cdr.detectChanges();
      window.setTimeout(() => window.print(), 50);
    } catch {
      this.error = 'آماده‌سازی رسید برای چاپ انجام نشد.';
    } finally {
      this.printingReceiptId = null;
      this.cdr.detectChanges();
    }
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
}
