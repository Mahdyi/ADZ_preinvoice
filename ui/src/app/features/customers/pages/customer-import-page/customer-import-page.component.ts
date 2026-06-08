import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Customer } from '../../models/customer.model';
import {
  CustomerImportParseResult,
  CustomerImportProgress,
} from '../../models/customer-import.model';
import { CustomerApiService } from '../../services/customer-api.service';
import { CustomerExcelImportService } from '../../services/customer-excel-import.service';

@Component({
  selector: 'app-customer-import-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, MessageModule, TableModule],
  templateUrl: './customer-import-page.component.html',
  styleUrl: './customer-import-page.component.css',
})
export class CustomerImportPageComponent {
  selectedFileName = '';
  parseResult: CustomerImportParseResult | null = null;
  parsing = false;
  importing = false;
  message = '';
  error = '';
  parseStatus = '';
  parseProgress: CustomerImportProgress[] = [];

  constructor(
    private readonly excelImport: CustomerExcelImportService,
    private readonly customers: CustomerApiService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  get validCount(): number {
    return this.parseResult?.validRows.length ?? 0;
  }

  get skippedCount(): number {
    return this.parseResult?.skippedRows.length ?? 0;
  }

  async handleFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.resetResult();

    if (!file) {
      return;
    }

    this.selectedFileName = file.name;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.error = 'فقط فایل xlsx قابل بارگذاری است.';
      input.value = '';
      return;
    }

    this.parsing = true;
    this.parseStatus = 'در حال خواندن فایل اکسل...';
    this.refreshView();
    this.addProgress({
      label: 'فایل انتخاب شد',
      status: 'done',
      detail: file.name,
    });
    try {
      this.parseResult = await this.excelImport.parse(file, (progress) =>
        this.addProgress(progress),
      );
      this.parseStatus = `خواندن فایل کامل شد. روش خواندن: ${this.parseResult.parser}، ردیف معتبر: ${this.validCount}، ردیف رد شده: ${this.skippedCount}`;
      this.message = this.validCount
        ? 'فایل با موفقیت خوانده شد. برای ثبت در دیتابیس دکمه ورود را بزنید.'
        : 'فایل خوانده شد، اما هیچ ردیف معتبری برای پیش نمایش پیدا نشد.';
      this.refreshView();
    } catch (error) {
      this.parseResult = null;
      this.parseStatus = 'خواندن فایل کامل نشد.';
      this.error =
        error instanceof Error
          ? error.message
          : 'خواندن فایل اکسل انجام نشد.';
      this.addProgress({
        label: 'خواندن فایل',
        status: 'error',
        detail: this.error,
      });
    } finally {
      this.parsing = false;
      this.refreshView();
    }
  }

  importCustomers(): void {
    if (!this.parseResult?.validRows.length) {
      this.error = 'هیچ ردیف معتبری برای ورود وجود ندارد.';
      return;
    }

    this.importing = true;
    this.message = '';
    this.error = '';

    this.customers
      .importByCode(this.parseResult.validRows)
      .pipe(finalize(() => (this.importing = false)))
      .subscribe({
        next: (customers) => this.handleImportSuccess(customers),
        error: () =>
          (this.error =
            'ورود مشتریان انجام نشد. فایل یا اتصال به دیتابیس را بررسی کنید.'),
      });
  }

  private handleImportSuccess(customers: Customer[]): void {
    this.message = `${customers.length} مشتری با موفقیت ثبت یا به‌روزرسانی شد.`;
  }

  private resetResult(): void {
    this.selectedFileName = '';
    this.parseResult = null;
    this.message = '';
    this.error = '';
    this.parseStatus = '';
    this.parseProgress = [];
    this.refreshView();
  }

  private addProgress(progress: CustomerImportProgress): void {
    const nextProgress = [...this.parseProgress];
    const existingIndex = nextProgress.findIndex(
      (item) => item.label === progress.label,
    );

    if (existingIndex >= 0) {
      nextProgress[existingIndex] = progress;
    } else {
      nextProgress.push(progress);
    }

    this.parseProgress = nextProgress;
    if (progress.status === 'running') {
      this.parseStatus = `${progress.label}...`;
    }

    this.refreshView();
  }

  private refreshView(): void {
    this.changeDetector.detectChanges();
  }
}
