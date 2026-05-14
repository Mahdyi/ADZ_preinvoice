import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';
import { CustomerApiService } from './customer-api.service';
import { Customer, CustomerDraft, emptyCustomer } from './customer.model';
import { EquipmentApiService } from './equipment-api.service';
import { EquipmentCatalogItem } from './equipment.model';
import { InvoiceRow, PreinvoiceItem, PreinvoiceItemDraft, PreinvoiceSummary } from './preinvoice.model';
import { PreinvoiceApiService } from './preinvoice-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  readonly isListRoute = window.location.pathname === '/preinvoices-list';
  customerQuery = '';
  customerOptions: Customer[] = [];
  selectedCustomer: Customer | null = null;
  newCustomer: CustomerDraft = { ...emptyCustomer };
  showCreateCustomer = false;

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

  readonly sellerText = 'فروشنده: ابزار دقیق زنگان - زنجان، بلوار آزادی، دانشگاه علوم پزشکی، پارک علم و فن آوری سلامت، کدپستی: 4515613191، شناسه ملی: 10460108920';
  readonly socialText = 'شبکه اجتماعی: ایتا';

  constructor(
    private readonly customers: CustomerApiService,
    private readonly equipment: EquipmentApiService,
    private readonly preinvoices: PreinvoiceApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.isListRoute) {
      this.loadPreinvoiceSummaries();
      return;
    }

    this.searchCustomers();

    const editId = Number(new URLSearchParams(window.location.search).get('preinvoiceId'));
    if (editId) {
      this.loadPreinvoiceForEdit(editId);
      return;
    }

    this.generateInvoiceNumber();
    this.rows.forEach((row) => this.searchEquipment(row));
  }

  get total(): number {
    return this.rows.reduce((sum, row) => sum + this.rowTotal(row), 0);
  }

  get printableRows(): InvoiceRow[] {
    return this.rows.filter((row) => row.description.trim() || row.note.trim() || row.equipmentQuery.trim());
  }

  get selectedListPrintableRows(): InvoiceRow[] {
    return this.selectedListRows.filter((row) => row.description.trim() || row.note.trim() || row.equipmentQuery.trim());
  }

  get isEditMode(): boolean {
    return this.preinvoiceId !== null;
  }

  get selectedListSubtotal(): number {
    return this.selectedListPrintableRows.reduce((sum, row) => sum + this.rowTotal(row), 0);
  }

  get selectedListVat(): number {
    return this.selectedListSubtotal * this.vatRate;
  }

  get selectedListGrandTotal(): number {
    return this.selectedListSubtotal + this.selectedListVat;
  }

  async loadPreinvoiceSummaries(): Promise<void> {
    this.loadingPreinvoiceSummaries = true;
    this.error = '';

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch('/api/preinvoice_with_totals?select=*&order=created_at.desc&limit=200', {
        signal: controller.signal
      });

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
    this.customers.list(this.customerQuery)
      .pipe(finalize(() => (this.loadingCustomers = false)))
      .subscribe({
        next: (customers) => {
          this.customerOptions = customers;
        },
        error: () => (this.error = 'دریافت مشتریان انجام نشد.')
      });
  }

  handleCustomerInput(): void {
    if (this.selectedCustomer && this.customerQuery !== this.selectedCustomer.title) {
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
      phone: customer.phone
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
      error: () => (this.error = 'ثبت مشتری جدید انجام نشد.')
    });
  }

  searchEquipment(row: InvoiceRow): void {
    this.equipment.search(row.equipmentQuery).subscribe({
      next: (items) => (row.equipmentOptions = items),
      error: () => (this.error = 'دریافت فهرست تجهیزات انجام نشد.')
    });
  }

  selectEquipment(row: InvoiceRow, item: EquipmentCatalogItem): void {
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

  addRow(): void {
    const row = this.emptyRow();
    this.rows.push(row);
    this.searchEquipment(row);
  }

  removeRow(index: number): void {
    if (this.rows.length === 1) {
      this.rows[0] = this.emptyRow();
      return;
    }

    this.rows.splice(index, 1);
  }

  rowTotal(row: InvoiceRow): number {
    return (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
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

    this.preinvoices.listItems(invoice.id)
      .pipe(finalize(() => {
        this.printingPreinvoiceId = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (items) => {
          this.listPrintMode = 'single';
          this.selectedListPreinvoice = invoice;
          this.selectedListRows = items.map((item) => this.itemToInvoiceRow(item));
          this.cdr.detectChanges();
          window.setTimeout(() => window.print(), 50);
        },
        error: () => (this.error = 'دریافت اقلام پیش فاکتور انجام نشد.')
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
      notes: null
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
        this.message = editing ? 'پیش فاکتور به‌روزرسانی شد.' : 'پیش فاکتور شما ساخته شد';
        this.cdr.detectChanges();
      }
    }, 3500);

    request
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          window.clearTimeout(fallbackTimer);
          if (!editing) {
            this.resetPreinvoiceForm();
          }
          this.message = editing ? 'پیش فاکتور به‌روزرسانی شد.' : 'پیش فاکتور شما ساخته شد';
          this.cdr.detectChanges();
        },
        error: () => {
          window.clearTimeout(fallbackTimer);
          this.error = 'ذخیره پیش فاکتور انجام نشد. شماره پیش فاکتور را بررسی کنید.';
          this.cdr.detectChanges();
        }
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
        firstValueFrom(this.preinvoices.listItems(id))
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
        phone: invoice.customer_phone
      };
      this.rows = items.length ? items.map((item) => this.itemToInvoiceRow(item)) : [this.emptyRow()];
    } catch {
      this.error = 'دریافت اطلاعات پیش فاکتور برای ویرایش انجام نشد.';
    } finally {
      this.loadingPreinvoice = false;
      this.cdr.detectChanges();
    }
  }

  private collectItems(): PreinvoiceItemDraft[] {
    return this.rows
      .filter((row) => row.description.trim() || row.note.trim())
      .map((row) => ({
        description: row.description.trim() || row.note.trim(),
        note: row.note.trim() || null,
        cal_position: row.calPosition.trim() || null,
        quantity: Number(row.quantity) || 0,
        unit_price: Number(row.unitPrice) || 0
      }));
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
      description: '',
      quantity: 1,
      note: '',
      calPosition: '',
      unitPrice: 0,
      measurementQuantity: '',
      location: ''
    };
  }

  private itemToInvoiceRow(item: PreinvoiceItem): InvoiceRow {
    return {
      equipmentQuery: item.description,
      equipmentOptions: [],
      description: item.description,
      quantity: Number(item.quantity) || 0,
      note: item.note ?? '',
      calPosition: item.cal_position ?? '',
      unitPrice: Number(item.unit_price) || 0,
      measurementQuantity: '',
      location: ''
    };
  }

  private summaryToCustomer(invoice: PreinvoiceSummary): Customer {
    return {
      id: invoice.customer_id,
      title: invoice.customer_title,
      code: invoice.customer_code,
      national_id: invoice.customer_national_id,
      economic_code: invoice.customer_economic_code,
      postal_code: invoice.customer_postal_code,
      address: invoice.customer_address,
      phone: invoice.customer_phone
    };
  }

  private generateInvoiceNumber(): void {
    const datePart = this.issueDate.replaceAll('-', '');
    this.preinvoices.latestForDate(datePart).subscribe({
      next: ([latest]) => {
        const lastNumber = latest?.preinvoice_number.split('-').at(-1);
        const nextNumber = String((Number(lastNumber) || 0) + 1).padStart(3, '0');
        this.preinvoiceNumber = `PI-${datePart}-${nextNumber}`;
      },
      error: () => (this.preinvoiceNumber = `PI-${datePart}-001`)
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
