import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, from } from 'rxjs';
import { environment } from '../environments/environment';
import { Preinvoice, PreinvoiceDraft, PreinvoiceItem, PreinvoiceItemDraft, PreinvoiceSummary } from './preinvoice.model';

@Injectable({ providedIn: 'root' })
export class PreinvoiceApiService {
  private readonly preinvoicesUrl = `${environment.apiUrl}/preinvoices`;
  private readonly itemsUrl = `${environment.apiUrl}/preinvoice_items`;
  private readonly totalsUrl = `${environment.apiUrl}/preinvoice_with_totals`;

  constructor(private readonly http: HttpClient) {}

  latestForDate(datePart: string): Observable<Preinvoice[]> {
    const params = new HttpParams()
      .set('select', 'preinvoice_number')
      .set('preinvoice_number', `like.PI-${datePart}-%`)
      .set('order', 'preinvoice_number.desc')
      .set('limit', '1');

    return this.http.get<Preinvoice[]>(this.preinvoicesUrl, { params });
  }

  listSummaries(): Observable<PreinvoiceSummary[]> {
    const params = new HttpParams()
      .set('select', '*')
      .set('order', 'created_at.desc')
      .set('limit', '200');

    return this.http.get<PreinvoiceSummary[]>(this.totalsUrl, { params });
  }

  getSummary(id: number): Observable<PreinvoiceSummary[]> {
    const params = new HttpParams()
      .set('select', '*')
      .set('id', `eq.${id}`)
      .set('limit', '1');

    return this.http.get<PreinvoiceSummary[]>(this.totalsUrl, { params });
  }

  listItems(preinvoiceId: number): Observable<PreinvoiceItem[]> {
    const params = new HttpParams()
      .set('preinvoice_id', `eq.${preinvoiceId}`)
      .set('order', 'id.asc');

    return this.http.get<PreinvoiceItem[]>(this.itemsUrl, { params });
  }

  createWithItems(invoice: PreinvoiceDraft, items: PreinvoiceItemDraft[]): Observable<Preinvoice> {
    return from(this.createWithItemsRequest(invoice, items));
  }

  updateWithItems(id: number, invoice: PreinvoiceDraft, items: PreinvoiceItemDraft[]): Observable<Preinvoice> {
    return from(this.updateWithItemsRequest(id, invoice, items));
  }

  private async createWithItemsRequest(invoice: PreinvoiceDraft, items: PreinvoiceItemDraft[]): Promise<Preinvoice> {
    await this.dispatchWrite(this.preinvoicesUrl, 'POST', invoice, 'return=minimal');
    const preinvoice = await this.fetchByNumber(invoice.preinvoice_number);
    await this.insertItems(items.map((item) => ({ ...item, preinvoice_id: preinvoice.id })));
    return preinvoice;
  }

  private async updateWithItemsRequest(id: number, invoice: PreinvoiceDraft, items: PreinvoiceItemDraft[]): Promise<Preinvoice> {
    await this.dispatchWrite(
      `${this.preinvoicesUrl}?id=eq.${id}`,
      'PATCH',
      invoice,
      'return=minimal'
    );
    const preinvoice = await this.fetchByNumber(invoice.preinvoice_number);

    await this.dispatchWrite(`${this.itemsUrl}?preinvoice_id=eq.${id}`, 'DELETE', null, 'return=minimal');
    await this.insertItems(items.map((item) => ({ ...item, preinvoice_id: id })));

    return preinvoice;
  }

  private async insertItems(rows: PreinvoiceItemDraft[]): Promise<void> {
    if (!rows.length) {
      return;
    }

    await this.dispatchWrite(this.itemsUrl, 'POST', rows, 'return=minimal');
  }

  private async fetchByNumber(preinvoiceNumber: string): Promise<Preinvoice> {
    const params = new HttpParams().set('preinvoice_number', `eq.${preinvoiceNumber}`);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const rows = await firstValueFrom(this.http.get<Preinvoice[]>(this.preinvoicesUrl, { params }));
      if (rows[0]) {
        return rows[0];
      }

      await this.delay(250);
    }

    throw new Error('Saved preinvoice was not returned by the API.');
  }

  private async dispatchWrite(url: string, method: string, body: unknown, prefer: string): Promise<void> {
    const request = fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Prefer: prefer
      },
      body: body === null ? undefined : JSON.stringify(body)
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(await response.text());
      }
    });

    request.catch((error) => console.error('PostgREST write failed', error));
    await Promise.race([request, this.delay(700)]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private firstResponse(response: Preinvoice[] | Preinvoice): Preinvoice {
    return Array.isArray(response) ? response[0] : response;
  }
}
