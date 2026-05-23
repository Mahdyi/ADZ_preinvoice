import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';
import { CustomerDraft } from './features/customers/models/customer.model';

interface ParseResult {
  rows: CustomerDraft[];
  skipped: number;
}

const headerMap: Record<string, keyof CustomerDraft> = {
  'شناسه/کد ملی': 'national_id',
  'کد اقتصادی': 'economic_code',
  'کد پستی': 'postal_code',
  آدرس: 'address',
  تلفن: 'phone',
  کد: 'code',
  عنوان: 'title',
};

@Injectable({ providedIn: 'root' })
export class ExcelImportService {
  async parseCustomers(file: File): Promise<ParseResult> {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const headers = new Map<number, keyof CustomerDraft>();

    const rows: CustomerDraft[] = [];
    let skipped = 0;

    worksheet.getRow(1).eachCell((cell, columnNumber) => {
      const field = headerMap[this.normalizeHeader(cell.text)];
      if (field) {
        headers.set(columnNumber, field);
      }
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      const customer = this.emptyDraft();

      for (const [columnNumber, field] of headers) {
        const value = this.cleanCell(row.getCell(columnNumber).text);
        if (field === 'title') {
          customer.title = value ?? '';
        } else {
          customer[field] = value;
        }
      }

      if (customer.title.trim()) {
        rows.push(customer);
      } else {
        skipped += 1;
      }
    });

    return { rows, skipped };
  }

  private emptyDraft(): CustomerDraft {
    return {
      national_id: null,
      economic_code: null,
      postal_code: null,
      address: null,
      phone: null,
      code: null,
      title: '',
    };
  }

  private normalizeHeader(header: string): string {
    return header
      .replace(/\u0643/g, 'ک')
      .replace(/\u064A/g, 'ی')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanCell(value: unknown): string | null {
    const text = String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    return text ? text : null;
  }
}
