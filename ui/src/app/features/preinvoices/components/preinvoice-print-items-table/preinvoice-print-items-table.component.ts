import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { InvoiceRow } from '../../models/preinvoice.model';
import { PreinvoiceFacadeService } from '../../services/preinvoice-facade.service';

@Component({
  selector: 'tse-preinvoice-print-items-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preinvoice-print-items-table.component.html',
  styleUrl: './preinvoice-print-items-table.component.css',
})
export class PreinvoicePrintItemsTableComponent {
  @Input() rows: InvoiceRow[] = [];
  private readonly facade = inject(PreinvoiceFacadeService);

  rowTotal(row: InvoiceRow): number {
    return this.facade.rowTotal(row);
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(value));
  }
}
