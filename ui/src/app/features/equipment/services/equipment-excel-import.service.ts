import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { EquipmentCatalogDraft, emptyEquipmentCatalogDraft } from '../models/equipment.model';
import {
  EquipmentImportParseResult,
  EquipmentImportProgress,
} from '../models/equipment-import.model';

type ProgressReporter = (progress: EquipmentImportProgress) => void;

const FILE_READ_TIMEOUT_MS = 10000;
const ZIP_LOAD_TIMEOUT_MS = 15000;
const ZIP_TEXT_TIMEOUT_MS = 10000;

const HEADER_ALIASES: Array<{
  labels: string[];
  field: keyof EquipmentCatalogDraft;
}> = [
  {
    labels: ['نام برگه'],
    field: 'sheet_name',
  },
  {
    labels: ['کمیت اندازه گیری', 'کمیت اندازه‌گیری'],
    field: 'measurement_quantity',
  },
  {
    labels: ['نام تجهیز'],
    field: 'equipment_name',
  },
  {
    labels: ['قیمت'],
    field: 'price',
  },
  {
    labels: ['محل'],
    field: 'location',
  },
];

@Injectable({ providedIn: 'root' })
export class EquipmentExcelImportService {
  private readonly headerMap = this.buildHeaderMap();

  async parse(
    file: File,
    onProgress?: ProgressReporter,
  ): Promise<EquipmentImportParseResult> {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      throw new Error('فقط فایل xlsx قابل بارگذاری است.');
    }

    this.report(onProgress, 'done', 'فایل انتخاب شد', file.name);

    this.report(onProgress, 'running', 'خواندن محتوای فایل');
    const fileBuffer = await this.withTimeout(
      this.readFileBuffer(file),
      FILE_READ_TIMEOUT_MS,
      'خواندن فایل در مرحله خواندن محتوای فایل متوقف شد.',
    );
    this.report(
      onProgress,
      'done',
      'خواندن محتوای فایل',
      `${fileBuffer.byteLength} بایت`,
    );

    this.report(onProgress, 'running', 'بارگذاری ساختار فایل اکسل');
    const zip = await this.withTimeout(
      JSZip.loadAsync(fileBuffer),
      ZIP_LOAD_TIMEOUT_MS,
      'خواندن فایل در مرحله بارگذاری ZIP متوقف شد.',
    );
    this.report(onProgress, 'done', 'بارگذاری ساختار فایل اکسل');

    const sharedStrings = await this.readSharedStrings(zip, onProgress);
    const sheetPath = await this.firstSheetPath(zip, onProgress);
    const sheetFile = zip.file(sheetPath);

    if (!sheetFile) {
      throw new Error('فایل اکسل فاقد شیت قابل خواندن است.');
    }

    this.report(onProgress, 'running', 'خواندن شیت اول', sheetPath);
    const sheetXml = await this.withTimeout(
      sheetFile.async('text'),
      ZIP_TEXT_TIMEOUT_MS,
      'خواندن فایل در مرحله خواندن شیت اول متوقف شد.',
    );
    this.report(
      onProgress,
      'done',
      'خواندن شیت اول',
      `${sheetXml.length} کاراکتر`,
    );

    this.report(onProgress, 'running', 'تحلیل XML شیت');
    const document = new DOMParser().parseFromString(sheetXml, 'application/xml');
    const rowElements = Array.from(document.getElementsByTagName('row'));
    this.report(
      onProgress,
      'done',
      'تحلیل XML شیت',
      `${rowElements.length} ردیف`,
    );

    const headerRow = rowElements[0];
    if (!headerRow) {
      throw new Error('ردیف عنوان ستون‌ها در فایل پیدا نشد.');
    }

    const headers = this.readXmlHeaders(headerRow, sharedStrings);
    const headerFields = Array.from(headers.values()).join('، ');
    this.report(
      onProgress,
      'done',
      'شناسایی ستون‌ها',
      headerFields ? `${headers.size} ستون: ${headerFields}` : '۰ ستون',
    );

    if (!headers.size) {
      throw new Error('هیچ ستون قابل شناسایی در ردیف اول فایل پیدا نشد.');
    }

    if (!Array.from(headers.values()).includes('equipment_name')) {
      throw new Error('ستون نام تجهیز در ردیف اول فایل پیدا نشد.');
    }

    const validRows: EquipmentCatalogDraft[] = [];
    const skippedRows: EquipmentImportParseResult['skippedRows'] = [];

    for (const rowElement of rowElements.slice(1)) {
      const rowNumber = Number(rowElement.getAttribute('r')) || 0;
      const equipment: EquipmentCatalogDraft = { ...emptyEquipmentCatalogDraft };

      for (const cell of Array.from(rowElement.getElementsByTagName('c'))) {
        const columnIndex = this.cellColumnIndex(cell.getAttribute('r') ?? '');
        const field = headers.get(columnIndex);

        if (!field) {
          continue;
        }

        const value = this.cleanCell(this.xmlCellText(cell, sharedStrings));
        if (field === 'price') {
          equipment.price = this.cleanPrice(value);
        } else if (field === 'equipment_name') {
          equipment.equipment_name = value ?? '';
        } else {
          equipment[field] = value;
        }
      }

      if (equipment.equipment_name.trim()) {
        validRows.push(equipment);
        continue;
      }

      skippedRows.push({
        rowNumber,
        reason: 'نام تجهیز خالی است.',
      });
    }

    this.report(
      onProgress,
      'done',
      'آماده‌سازی پیش‌نمایش',
      `${validRows.length} ردیف معتبر، ${skippedRows.length} ردیف رد شده`,
    );

    return {
      validRows,
      skippedRows,
      recognizedColumnCount: headers.size,
      parser: 'xlsx-zip',
    };
  }

  private buildHeaderMap(): Map<string, keyof EquipmentCatalogDraft> {
    const headerMap = new Map<string, keyof EquipmentCatalogDraft>();

    for (const alias of HEADER_ALIASES) {
      for (const label of alias.labels) {
        headerMap.set(this.normalizeHeader(label), alias.field);
      }
    }

    return headerMap;
  }

  private async readSharedStrings(
    zip: JSZip,
    onProgress?: ProgressReporter,
  ): Promise<string[]> {
    const sharedStringsFile = zip.file('xl/sharedStrings.xml');
    if (!sharedStringsFile) {
      this.report(onProgress, 'done', 'خواندن رشته‌های مشترک', '۰ مورد');
      return [];
    }

    this.report(onProgress, 'running', 'خواندن رشته‌های مشترک');
    const xml = await this.withTimeout(
      sharedStringsFile.async('text'),
      ZIP_TEXT_TIMEOUT_MS,
      'خواندن فایل در مرحله خواندن متن‌های مشترک متوقف شد.',
    );
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    const sharedStrings = Array.from(document.getElementsByTagName('si')).map((item) =>
      Array.from(item.getElementsByTagName('t'))
        .map((text) => text.textContent ?? '')
        .join(''),
    );
    this.report(
      onProgress,
      'done',
      'خواندن رشته‌های مشترک',
      `${sharedStrings.length} مورد`,
    );
    return sharedStrings;
  }

  private async firstSheetPath(
    zip: JSZip,
    onProgress?: ProgressReporter,
  ): Promise<string> {
    this.report(onProgress, 'running', 'پیدا کردن مسیر شیت اول');
    const workbookXml = await this.readOptionalZipText(
      zip,
      'xl/workbook.xml',
      'خواندن فایل در مرحله خواندن workbook متوقف شد.',
    );
    const relationshipsXml = await this.readOptionalZipText(
      zip,
      'xl/_rels/workbook.xml.rels',
      'خواندن فایل در مرحله خواندن رابطه‌های workbook متوقف شد.',
    );

    if (!workbookXml || !relationshipsXml) {
      this.report(
        onProgress,
        'done',
        'پیدا کردن مسیر شیت اول',
        'xl/worksheets/sheet1.xml',
      );
      return 'xl/worksheets/sheet1.xml';
    }

    const workbookDocument = new DOMParser().parseFromString(
      workbookXml,
      'application/xml',
    );
    const relationshipsDocument = new DOMParser().parseFromString(
      relationshipsXml,
      'application/xml',
    );
    const firstSheet = workbookDocument.getElementsByTagName('sheet')[0];
    const relationshipId =
      firstSheet?.getAttribute('r:id') ?? firstSheet?.getAttribute('id');

    if (!relationshipId) {
      this.report(
        onProgress,
        'done',
        'پیدا کردن مسیر شیت اول',
        'xl/worksheets/sheet1.xml',
      );
      return 'xl/worksheets/sheet1.xml';
    }

    const relationship = Array.from(
      relationshipsDocument.getElementsByTagName('Relationship'),
    ).find((item) => item.getAttribute('Id') === relationshipId);
    const target = relationship?.getAttribute('Target');

    if (!target) {
      this.report(
        onProgress,
        'done',
        'پیدا کردن مسیر شیت اول',
        'xl/worksheets/sheet1.xml',
      );
      return 'xl/worksheets/sheet1.xml';
    }

    const sheetPath = target.startsWith('xl/') ? target : `xl/${target}`;
    this.report(onProgress, 'done', 'پیدا کردن مسیر شیت اول', sheetPath);
    return sheetPath;
  }

  private readXmlHeaders(
    headerRow: Element,
    sharedStrings: string[],
  ): Map<number, keyof EquipmentCatalogDraft> {
    const headers = new Map<number, keyof EquipmentCatalogDraft>();

    for (const cell of Array.from(headerRow.getElementsByTagName('c'))) {
      const columnIndex = this.cellColumnIndex(cell.getAttribute('r') ?? '');
      const field = this.headerMap.get(
        this.normalizeHeader(this.xmlCellText(cell, sharedStrings)),
      );

      if (field) {
        headers.set(columnIndex, field);
      }
    }

    return headers;
  }

  private xmlCellText(cell: Element, sharedStrings: string[]): string {
    const type = cell.getAttribute('t');

    if (type === 'inlineStr') {
      return Array.from(cell.getElementsByTagName('t'))
        .map((item) => item.textContent ?? '')
        .join('');
    }

    const value = cell.getElementsByTagName('v')[0]?.textContent ?? '';
    if (type === 's') {
      return sharedStrings[Number(value)] ?? '';
    }

    return value;
  }

  private cellColumnIndex(reference: string): number {
    const letters = reference.replace(/[0-9]/g, '').toUpperCase();
    let index = 0;

    for (const letter of letters) {
      index = index * 26 + letter.charCodeAt(0) - 64;
    }

    return index;
  }

  private normalizeHeader(value: string): string {
    return value
      .normalize('NFKC')
      .replaceAll('ك', 'ک')
      .replaceAll('ي', 'ی')
      .replaceAll('ى', 'ی')
      .replaceAll('\u200c', ' ')
      .replaceAll('\u00a0', ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanCell(value: string): string | null {
    const trimmed = value.replace(/\s+/g, ' ').trim();
    return trimmed || null;
  }

  private cleanPrice(value: string | null): number {
    return Number(value?.replace(/,/g, '') ?? 0) || 0;
  }

  private readOptionalZipText(
    zip: JSZip,
    path: string,
    timeoutMessage: string,
  ): Promise<string | null> {
    const file = zip.file(path);
    if (!file) {
      return Promise.resolve(null);
    }

    return this.withTimeout(file.async('text'), ZIP_TEXT_TIMEOUT_MS, timeoutMessage);
  }

  private readFileBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () =>
        reject(new Error('خواندن محتوای فایل اکسل انجام نشد.'));
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
          return;
        }

        reject(new Error('محتوای فایل اکسل قابل خواندن نیست.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);

      promise
        .then((value) => {
          window.clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((error) => {
          window.clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private report(
    onProgress: ProgressReporter | undefined,
    status: EquipmentImportProgress['status'],
    label: string,
    detail?: string,
  ): void {
    onProgress?.({ label, status, detail });
  }
}
