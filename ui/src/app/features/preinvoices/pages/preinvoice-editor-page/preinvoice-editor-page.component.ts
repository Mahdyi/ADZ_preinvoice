import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CustomerApiService } from '../../../customers/services/customer-api.service';
import {
  Customer,
  CustomerDraft,
  emptyCustomer,
} from '../../../customers/models/customer.model';
import { EquipmentCatalogApiService } from '../../../equipment/services/equipment-catalog-api.service';
import {
  EquipmentCatalogDraft,
  EquipmentCatalogItem,
  emptyEquipmentCatalogDraft,
} from '../../../equipment/models/equipment.model';
import {
  InvoiceRow,
  PreinvoiceItem,
  PreinvoiceItemDraft,
  PreinvoiceSummary,
} from '../../models/preinvoice.model';
import { PreinvoiceApiService } from '../../services/preinvoice-api.service';
import { PreinvoiceFacadeService } from '../../services/preinvoice-facade.service';
import { BuyerInfoFormComponent } from '../../components/buyer-info-form/buyer-info-form.component';
import { CreateCustomerModalComponent } from '../../components/create-customer-modal/create-customer-modal.component';
import { CreateEquipmentModalComponent } from '../../components/create-equipment-modal/create-equipment-modal.component';
import { PreinvoiceHeaderComponent } from '../../components/preinvoice-header/preinvoice-header.component';
import { PreinvoiceItemsTableComponent } from '../../components/preinvoice-items-table/preinvoice-items-table.component';
import { PreinvoiceFooterComponent } from '../../components/preinvoice-footer/preinvoice-footer.component';
import { PreinvoicePrintItemsTableComponent } from '../../components/preinvoice-print-items-table/preinvoice-print-items-table.component';
import { PreinvoiceTotalsComponent } from '../../components/preinvoice-totals/preinvoice-totals.component';

@Component({
  selector: 'app-preinvoice-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    MessageModule,
    BuyerInfoFormComponent,
    CreateCustomerModalComponent,
    CreateEquipmentModalComponent,
    PreinvoiceFooterComponent,
    PreinvoiceHeaderComponent,
    PreinvoiceItemsTableComponent,
    PreinvoicePrintItemsTableComponent,
    PreinvoiceTotalsComponent,
  ],
  templateUrl: './preinvoice-editor-page.component.html',
  styleUrl: '../../../../app.component.css',
})
export class PreinvoiceEditorPageComponent implements OnInit {
  readonly isListRoute = false;
  customerQuery = '';
  customerOptions: Customer[] = [];
  selectedCustomer: Customer | null = null;
  newCustomer: CustomerDraft = { ...emptyCustomer };
  showCreateCustomer = false;
  newEquipment: EquipmentCatalogDraft = { ...emptyEquipmentCatalogDraft };
  newEquipmentQuantity = 1;
  newEquipmentNote = '';
  newEquipmentCalPosition = '';
  showCreateEquipment = false;
  equipmentTargetRow: InvoiceRow | null = null;

  preinvoiceId: number | null = null;
  preinvoiceNumber = '';
  issueDate = this.today();
  dueDate = '';

  rows: InvoiceRow[] = [this.emptyRow()];
  saving = false;
  loadingPreinvoice = false;
  loadingCustomers = false;
  message = '';
  error = '';
  preinvoiceSummaries: PreinvoiceSummary[] = [];
  loadingPreinvoiceSummaries = false;
  printingPreinvoiceId: number | null = null;
  listPrintMode: 'all' | 'single' = 'all';
  selectedListPreinvoice: PreinvoiceSummary | null = null;
  selectedListRows: InvoiceRow[] = [];
  readonly vatRate = 0.09;
  readonly rowTotalForTable = (row: InvoiceRow): number => this.rowTotal(row);

  readonly sellerText =
    'فروشنده: ابزار دقیق زنگان - زنجان، بلوار آزادی، دانشگاه علوم پزشکی، پارک علم و فن آوری سلامت، کدپستی: 4515613191، شناسه ملی: 10460108920';
  readonly socialText = 'شبکه اجتماعی: ایتا';

  constructor(
    private readonly customers: CustomerApiService,
    private readonly equipment: EquipmentCatalogApiService,
    private readonly preinvoices: PreinvoiceApiService,
    private readonly facade: PreinvoiceFacadeService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.isListRoute) {
      this.loadPreinvoiceSummaries();
      return;
    }

    this.searchCustomers();

    const editId = Number(
      new URLSearchParams(window.location.search).get('preinvoiceId'),
    );
    if (editId) {
      this.loadPreinvoiceForEdit(editId);
      return;
    }

    this.generateInvoiceNumber();
    this.rows.forEach((row) => this.searchEquipment(row));
  }

  get printableRows(): InvoiceRow[] {
    return this.facade.printableRows(this.rows);
  }

  get isEditMode(): boolean {
    return this.preinvoiceId !== null;
  }

  get currentSubtotal(): number {
    return this.facade.subtotal(this.rows);
  }

  get newEquipmentRowNumber(): number {
    const index = this.equipmentTargetRow
      ? this.rows.indexOf(this.equipmentTargetRow)
      : -1;
    return index >= 0 ? index + 1 : this.rows.length;
  }

  get newEquipmentLineTotal(): number {
    return (
      (Number(this.newEquipmentQuantity) || 0) *
      (Number(this.newEquipment.price) || 0)
    );
  }

  async loadPreinvoiceSummaries(): Promise<void> {
    this.loadingPreinvoiceSummaries = true;
    this.error = '';

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(
        '/api/preinvoice_with_totals?select=*&order=created_at.desc&limit=200',
        {
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      this.preinvoiceSummaries = await response.json();
    } catch {
      this.error = 'دریافت لیست پیش فاکتورها انجام نشد.';
    } finally {
      window.clearTimeout(timeoutId);
      this.loadingPreinvoiceSummaries = false;
      this.cdr.detectChanges();
    }
  }

  searchCustomers(): void {
    this.loadingCustomers = true;
    this.customers
      .list(this.customerQuery)
      .pipe(finalize(() => (this.loadingCustomers = false)))
      .subscribe({
        next: (customers) => {
          this.customerOptions = customers;
          const exactCustomer = customers.find(
            (customer) =>
              this.normalizedText(customer.title) ===
              this.normalizedText(this.customerQuery),
          );

          if (!this.selectedCustomer && exactCustomer) {
            this.selectCustomer(exactCustomer);
          }
        },
        error: () => (this.error = 'دریافت مشتریان انجام نشد.'),
      });
  }

  handleCustomerInput(): void {
    if (
      this.selectedCustomer &&
      this.customerQuery !== this.selectedCustomer.title
    ) {
      this.selectedCustomer = null;
    }

    this.searchCustomers();
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.customerQuery = customer.title;
    this.customerOptions = [];
    this.showCreateCustomer = false;
    this.newCustomer = {
      ...emptyCustomer,
      title: customer.title,
      code: customer.code,
      national_id: customer.national_id,
      economic_code: customer.economic_code,
      postal_code: customer.postal_code,
      address: customer.address,
      phone: customer.phone,
    };
  }

  prepareNewCustomer(): void {
    this.showCreateCustomer = true;
    this.customerOptions = [];
    this.newCustomer = { ...emptyCustomer, title: this.customerQuery.trim() };
  }

  closeCreateCustomer(): void {
    this.showCreateCustomer = false;
  }

  createCustomer(): void {
    this.error = '';

    if (!this.newCustomer.title.trim()) {
      this.error = 'عنوان مشتری الزامی است.';
      return;
    }

    this.customers.create(this.newCustomer).subscribe({
      next: ([customer]) => {
        this.selectCustomer(customer);
        this.showCreateCustomer = false;
        this.message = 'مشتری جدید ثبت و انتخاب شد.';
      },
      error: () => (this.error = 'ثبت مشتری جدید انجام نشد.'),
    });
  }

  prepareNewEquipment(row: InvoiceRow): void {
    this.error = '';
    this.equipmentTargetRow = row;
    row.equipmentOptions = [];
    this.newEquipment = {
      ...emptyEquipmentCatalogDraft,
      equipment_name: (row.description || row.equipmentQuery).trim(),
      price: Number(row.unitPrice) || 0,
      measurement_quantity: null,
      location: row.location || null,
    };
    this.newEquipmentQuantity = Number(row.quantity) || 1;
    this.newEquipmentNote = row.note;
    this.newEquipmentCalPosition = row.calPosition;
    this.showCreateEquipment = true;
  }

  prepareNewEquipmentForNewRow(): void {
    const emptyRow = this.rows.find((row) => this.isEmptyRow(row));
    const targetRow = emptyRow ?? this.addRow();
    this.prepareNewEquipment(targetRow);
  }

  closeCreateEquipment(): void {
    this.showCreateEquipment = false;
    this.equipmentTargetRow = null;
    this.newEquipment = { ...emptyEquipmentCatalogDraft };
    this.newEquipmentQuantity = 1;
    this.newEquipmentNote = '';
    this.newEquipmentCalPosition = '';
  }

  createEquipment(): void {
    this.error = '';

    if (!this.newEquipment.equipment_name.trim()) {
      this.error = 'نام تجهیز الزامی است.';
      return;
    }

    this.equipment.create(this.newEquipment).subscribe({
      next: ([item]) => {
        if (item && this.equipmentTargetRow) {
          this.selectEquipment(this.equipmentTargetRow, item);
          this.equipmentTargetRow.quantity =
            Number(this.newEquipmentQuantity) || 0;
          this.equipmentTargetRow.note = this.newEquipmentNote;
          this.equipmentTargetRow.calPosition = this.newEquipmentCalPosition;
        }

        this.message = 'تجهیز جدید ثبت و انتخاب شد.';
        this.closeCreateEquipment();
      },
      error: () => (this.error = 'ثبت تجهیز جدید انجام نشد.'),
    });
  }

  searchEquipment(row: InvoiceRow): void {
    this.equipment.search(row.equipmentQuery).subscribe({
      next: (items) => {
        row.equipmentOptions = items;
        const exactItem = items.find(
          (item) =>
            this.normalizedText(item.equipment_name) ===
            this.normalizedText(row.equipmentQuery),
        );

        if (exactItem) {
          this.selectEquipment(row, exactItem);
        }
      },
      error: () => (this.error = 'دریافت فهرست تجهیزات انجام نشد.'),
    });
  }

  selectEquipment(row: InvoiceRow, item: EquipmentCatalogItem): void {
    row.selectedEquipment = item;
    row.description = item.equipment_name;
    row.equipmentQuery = item.equipment_name;
    row.unitPrice = Number(item.price) || 0;
    row.measurementQuantity = item.measurement_quantity ?? '';
    row.location = item.location ?? '';
    row.equipmentOptions = [];

    if (!row.quantity || row.quantity < 1) {
      row.quantity = 1;
    }
  }

  addRow(): InvoiceRow {
    const row = this.emptyRow();
    this.rows.push(row);
    this.searchEquipment(row);
    return row;
  }

  removeRow(index: number): void {
    if (this.rows.length === 1) {
      this.rows[0] = this.emptyRow();
      return;
    }

    this.rows.splice(index, 1);
  }

  rowTotal(row: InvoiceRow): number {
    return this.facade.rowTotal(row);
  }

  printListReport(): void {
    this.listPrintMode = 'all';
    this.selectedListPreinvoice = null;
    this.selectedListRows = [];
    window.setTimeout(() => window.print(), 50);
  }

  printPreinvoiceReport(invoice: PreinvoiceSummary): void {
    this.error = '';
    this.printingPreinvoiceId = invoice.id;

    this.preinvoices
      .listItems(invoice.id)
      .pipe(
        finalize(() => {
          this.printingPreinvoiceId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (items) => {
          this.listPrintMode = 'single';
          this.selectedListPreinvoice = invoice;
          this.selectedListRows = items.map((item) =>
            this.itemToInvoiceRow(item),
          );
          this.cdr.detectChanges();
          window.setTimeout(() => window.print(), 50);
        },
        error: () => (this.error = 'دریافت اقلام پیش فاکتور انجام نشد.'),
      });
  }

  editPreinvoice(invoice: PreinvoiceSummary): void {
    window.location.href = `/?preinvoiceId=${invoice.id}`;
  }

  savePreinvoice(): void {
    this.error = '';
    this.message = '';

    if (!this.selectedCustomer?.id) {
      this.error = 'ابتدا مشتری را انتخاب یا ایجاد کنید.';
      return;
    }

    const items = this.collectItems();
    if (!items.length) {
      this.error = 'حداقل یک ردیف تجهیز یا توضیح وارد کنید.';
      return;
    }

    this.saving = true;
    const invoice = {
      customer_id: this.selectedCustomer.id,
      preinvoice_number: this.preinvoiceNumber.trim(),
      status: 'draft',
      issue_date: this.issueDate,
      due_date: this.dueDate || null,
      notes: null,
    };

    const editing = this.isEditMode;
    const request = this.preinvoiceId
      ? this.preinvoices.updateWithItems(this.preinvoiceId, invoice, items)
      : this.preinvoices.createWithItems(invoice, items);
    const fallbackTimer = window.setTimeout(() => {
      if (this.saving) {
        this.saving = false;
        if (!editing) {
          this.resetPreinvoiceForm();
        }
        this.message = editing
          ? 'پیش فاکتور به‌روزرسانی شد.'
          : 'پیش فاکتور شما ساخته شد';
        this.cdr.detectChanges();
      }
    }, 3500);

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        window.clearTimeout(fallbackTimer);
        if (!editing) {
          this.resetPreinvoiceForm();
        }
        this.message = editing
          ? 'پیش فاکتور به‌روزرسانی شد.'
          : 'پیش فاکتور شما ساخته شد';
        this.cdr.detectChanges();
      },
      error: () => {
        window.clearTimeout(fallbackTimer);
        this.error =
          'ذخیره پیش فاکتور انجام نشد. شماره پیش فاکتور را بررسی کنید.';
        this.cdr.detectChanges();
      },
    });
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(value));
  }

  private async loadPreinvoiceForEdit(id: number): Promise<void> {
    this.loadingPreinvoice = true;
    this.error = '';

    try {
      const [summaries, items] = await Promise.all([
        firstValueFrom(this.preinvoices.getSummary(id)),
        firstValueFrom(this.preinvoices.listItems(id)),
      ]);
      const invoice = summaries[0];

      if (!invoice) {
        this.error = 'پیش فاکتور انتخاب شده پیدا نشد.';
        return;
      }

      this.preinvoiceId = invoice.id;
      this.preinvoiceNumber = invoice.preinvoice_number;
      this.issueDate = invoice.issue_date;
      this.dueDate = invoice.due_date ?? '';
      this.selectedCustomer = this.summaryToCustomer(invoice);
      this.customerQuery = invoice.customer_title;
      this.customerOptions = [];
      this.newCustomer = {
        title: invoice.customer_title,
        code: invoice.customer_code,
        national_id: invoice.customer_national_id,
        economic_code: invoice.customer_economic_code,
        postal_code: invoice.customer_postal_code,
        address: invoice.customer_address,
        phone: invoice.customer_phone,
      };
      this.rows = items.length
        ? items.map((item) => this.itemToInvoiceRow(item))
        : [this.emptyRow()];
    } catch {
      this.error = 'دریافت اطلاعات پیش فاکتور برای ویرایش انجام نشد.';
    } finally {
      this.loadingPreinvoice = false;
      this.cdr.detectChanges();
    }
  }

  private collectItems(): PreinvoiceItemDraft[] {
    return this.facade.collectItems(this.rows);
  }

  private resetPreinvoiceForm(): void {
    this.preinvoiceId = null;
    this.customerQuery = '';
    this.customerOptions = [];
    this.selectedCustomer = null;
    this.newCustomer = { ...emptyCustomer };
    this.showCreateCustomer = false;
    this.issueDate = this.today();
    this.dueDate = '';
    this.rows = [this.emptyRow()];
    this.rows.forEach((row) => this.searchEquipment(row));
    this.generateInvoiceNumber();
  }

  private emptyRow(): InvoiceRow {
    return {
      equipmentQuery: '',
      equipmentOptions: [],
      selectedEquipment: null,
      description: '',
      quantity: 1,
      note: '',
      calPosition: '',
      unitPrice: 0,
      measurementQuantity: '',
      location: '',
    };
  }

  private isEmptyRow(row: InvoiceRow): boolean {
    return (
      !row.equipmentQuery.trim() &&
      !row.description.trim() &&
      !row.note.trim() &&
      !row.calPosition.trim() &&
      !(Number(row.unitPrice) || 0)
    );
  }

  private itemToInvoiceRow(item: PreinvoiceItem): InvoiceRow {
    return this.facade.itemToInvoiceRow(item);
  }

  private summaryToCustomer(invoice: PreinvoiceSummary): Customer {
    return this.facade.summaryToCustomer(invoice);
  }

  private generateInvoiceNumber(): void {
    const datePart = this.issueDate.replaceAll('-', '');
    this.preinvoices.latestForDate(datePart).subscribe({
      next: ([latest]) => {
        const lastNumber = latest?.preinvoice_number.split('-').at(-1);
        const nextNumber = String((Number(lastNumber) || 0) + 1).padStart(
          3,
          '0',
        );
        this.preinvoiceNumber = `PI-${datePart}-${nextNumber}`;
      },
      error: () => (this.preinvoiceNumber = `PI-${datePart}-001`),
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private normalizedText(value: string): string {
    return value.trim().replaceAll('ك', 'ک').replaceAll('ي', 'ی');
  }
}
