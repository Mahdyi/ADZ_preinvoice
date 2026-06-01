import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EquipmentReceiptItem,
  EquipmentReceiptItemDraft,
  EquipmentReceiptRecord,
  EquipmentReceiptRecordDraft,
  EquipmentReceiptSummary,
} from '../models/equipment-receipt.model';

@Injectable({ providedIn: 'root' })
export class EquipmentReceiptApiService {
  private readonly receiptsUrl = `${environment.apiUrl}/equipment_receipts`;
  private readonly itemsUrl = `${environment.apiUrl}/equipment_receipt_items`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<EquipmentReceiptSummary[]> {
    const params = new HttpParams()
      .set('select', '*')
      .set('order', 'created_at.desc')
      .set('limit', '200');

    return this.http.get<EquipmentReceiptSummary[]>(this.receiptsUrl, {
      params,
    });
  }

  get(id: number): Observable<EquipmentReceiptRecord[]> {
    const params = new HttpParams()
      .set('select', '*')
      .set('id', `eq.${id}`)
      .set('limit', '1');

    return this.http.get<EquipmentReceiptRecord[]>(this.receiptsUrl, {
      params,
    });
  }

  listItems(receiptId: number): Observable<EquipmentReceiptItem[]> {
    const params = new HttpParams()
      .set('equipment_receipt_id', `eq.${receiptId}`)
      .set('order', 'sort_order.asc,id.asc');

    return this.http.get<EquipmentReceiptItem[]>(this.itemsUrl, { params });
  }

  createWithItems(
    receipt: EquipmentReceiptRecordDraft,
    items: EquipmentReceiptItemDraft[],
  ): Observable<EquipmentReceiptRecord> {
    return from(this.createWithItemsRequest(receipt, items));
  }

  updateWithItems(
    id: number,
    receipt: EquipmentReceiptRecordDraft,
    items: EquipmentReceiptItemDraft[],
  ): Observable<EquipmentReceiptRecord> {
    return from(this.updateWithItemsRequest(id, receipt, items));
  }

  private async createWithItemsRequest(
    receipt: EquipmentReceiptRecordDraft,
    items: EquipmentReceiptItemDraft[],
  ): Promise<EquipmentReceiptRecord> {
    const [created] = await this.dispatchJson<EquipmentReceiptRecord[]>(
      this.receiptsUrl,
      'POST',
      receipt,
      'return=representation',
    );

    await this.insertItems(
      items.map((item) => ({
        ...item,
        equipment_receipt_id: created.id,
      })),
    );

    return created;
  }

  private async updateWithItemsRequest(
    id: number,
    receipt: EquipmentReceiptRecordDraft,
    items: EquipmentReceiptItemDraft[],
  ): Promise<EquipmentReceiptRecord> {
    const [updated] = await this.dispatchJson<EquipmentReceiptRecord[]>(
      `${this.receiptsUrl}?id=eq.${id}`,
      'PATCH',
      receipt,
      'return=representation',
    );

    await this.dispatchWrite(
      `${this.itemsUrl}?equipment_receipt_id=eq.${id}`,
      'DELETE',
      null,
      'return=minimal',
    );

    await this.insertItems(
      items.map((item) => ({
        ...item,
        equipment_receipt_id: id,
      })),
    );

    return updated;
  }

  private async insertItems(items: EquipmentReceiptItemDraft[]): Promise<void> {
    if (!items.length) {
      return;
    }

    await this.dispatchWrite(this.itemsUrl, 'POST', items, 'return=minimal');
  }

  private async dispatchJson<T>(
    url: string,
    method: string,
    body: unknown,
    prefer: string,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Prefer: prefer,
      },
      body: body === null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => window.clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json() as Promise<T>;
  }

  private async dispatchWrite(
    url: string,
    method: string,
    body: unknown,
    prefer: string,
  ): Promise<void> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Prefer: prefer,
      },
      body: body === null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => window.clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(await response.text());
    }
  }
}
