import { Injectable } from '@angular/core';
import { Customer } from '../../customers/models/customer.model';
import {
  InvoiceRow,
  PreinvoiceItem,
  PreinvoiceItemDraft,
  PreinvoiceSummary,
} from '../models/preinvoice.model';

@Injectable({ providedIn: 'root' })
export class PreinvoiceFacadeService {
  readonly vatRate = 0.09;

  rowTotal(row: InvoiceRow): number {
    return (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
  }

  subtotal(rows: InvoiceRow[]): number {
    return this.printableRows(rows).reduce(
      (sum, row) => sum + this.rowTotal(row),
      0,
    );
  }

  vat(value: number): number {
    return value * this.vatRate;
  }

  grandTotal(value: number): number {
    return value + this.vat(value);
  }

  printableRows(rows: InvoiceRow[]): InvoiceRow[] {
    return rows.filter(
      (row) =>
        row.description.trim() || row.note.trim() || row.equipmentQuery.trim(),
    );
  }

  collectItems(rows: InvoiceRow[]): PreinvoiceItemDraft[] {
    return rows
      .filter((row) => row.description.trim() || row.note.trim())
      .map((row) => ({
        description: row.description.trim() || row.note.trim(),
        note: row.note.trim() || null,
        cal_position: row.calPosition.trim() || null,
        quantity: Number(row.quantity) || 0,
        unit_price: Number(row.unitPrice) || 0,
      }));
  }

  emptyRow(): InvoiceRow {
    return {
      equipmentQuery: '',
      equipmentOptions: [],
      description: '',
      quantity: 1,
      note: '',
      calPosition: '',
      unitPrice: 0,
      measurementQuantity: '',
      location: '',
    };
  }

  itemToInvoiceRow(item: PreinvoiceItem): InvoiceRow {
    return {
      equipmentQuery: item.description,
      equipmentOptions: [],
      description: item.description,
      quantity: Number(item.quantity) || 0,
      note: item.note ?? '',
      calPosition: item.cal_position ?? '',
      unitPrice: Number(item.unit_price) || 0,
      measurementQuantity: '',
      location: '',
    };
  }

  summaryToCustomer(invoice: PreinvoiceSummary): Customer {
    return {
      id: invoice.customer_id,
      title: invoice.customer_title,
      code: invoice.customer_code,
      national_id: invoice.customer_national_id,
      economic_code: invoice.customer_economic_code,
      postal_code: invoice.customer_postal_code,
      address: invoice.customer_address,
      phone: invoice.customer_phone,
    };
  }
}
