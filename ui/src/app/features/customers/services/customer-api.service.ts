import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Customer, CustomerDraft } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly baseUrl = `${environment.apiUrl}/customers`;

  constructor(private readonly http: HttpClient) {}

  list(search = ''): Observable<Customer[]> {
    let params = new HttpParams()
      .set('select', '*')
      .set('order', 'id.desc')
      .set('limit', '100');

    const term = search.trim();
    if (term) {
      params = params.set(
        'or',
        `(title.ilike.*${term}*,code.ilike.*${term}*,national_id.ilike.*${term}*,phone.ilike.*${term}*)`,
      );
    }

    return this.http.get<Customer[]>(this.baseUrl, { params });
  }

  create(customer: CustomerDraft): Observable<Customer[]> {
    return this.http.post<Customer[]>(this.baseUrl, [this.clean(customer)], {
      headers: this.returnHeaders(),
    });
  }

  update(id: number, customer: CustomerDraft): Observable<Customer[]> {
    const params = new HttpParams().set('id', `eq.${id}`);
    return this.http.patch<Customer[]>(this.baseUrl, this.clean(customer), {
      params,
      headers: this.returnHeaders(),
    });
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('id', `eq.${id}`);
    return this.http.delete<void>(this.baseUrl, { params });
  }

  importByCode(rows: CustomerDraft[]): Observable<Customer[]> {
    const params = new HttpParams().set('on_conflict', 'code');
    return this.http.post<Customer[]>(
      this.baseUrl,
      rows.map((row) => this.clean(row)),
      {
        params,
        headers: this.returnHeaders().set(
          'Prefer',
          'resolution=merge-duplicates,return=representation',
        ),
      },
    );
  }

  private returnHeaders(): HttpHeaders {
    return new HttpHeaders({ Prefer: 'return=representation' });
  }

  private clean(customer: CustomerDraft): CustomerDraft {
    return {
      national_id: this.blankToNull(customer.national_id),
      economic_code: this.blankToNull(customer.economic_code),
      postal_code: this.blankToNull(customer.postal_code),
      address: this.blankToNull(customer.address),
      phone: this.blankToNull(customer.phone),
      code: this.blankToNull(customer.code),
      title: customer.title.trim(),
    };
  }

  private blankToNull(value: string | null): string | null {
    const trimmed = value?.toString().trim() ?? '';
    return trimmed ? trimmed : null;
  }
}
