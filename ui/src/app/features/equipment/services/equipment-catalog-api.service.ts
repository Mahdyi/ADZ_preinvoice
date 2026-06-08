import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  EquipmentCatalogDraft,
  EquipmentCatalogItem,
} from '../models/equipment.model';

@Injectable({ providedIn: 'root' })
export class EquipmentCatalogApiService {
  private readonly baseUrl = `${environment.apiUrl}/equipment_catalog`;

  constructor(private readonly http: HttpClient) {}

  search(term = ''): Observable<EquipmentCatalogItem[]> {
    let params = new HttpParams()
      .set('select', '*')
      .set('order', 'equipment_name.asc')
      .set('limit', '30');

    const cleaned = term.trim();
    if (cleaned) {
      params = params.set(
        'or',
        `(equipment_name.ilike.*${cleaned}*,sheet_name.ilike.*${cleaned}*,measurement_quantity.ilike.*${cleaned}*,location.ilike.*${cleaned}*)`,
      );
    }

    return this.http.get<EquipmentCatalogItem[]>(this.baseUrl, { params });
  }

  create(item: EquipmentCatalogDraft): Observable<EquipmentCatalogItem[]> {
    return this.http.post<EquipmentCatalogItem[]>(
      this.baseUrl,
      [this.clean(item)],
      {
        headers: { Prefer: 'return=representation' },
      },
    );
  }

  replaceAll(rows: EquipmentCatalogDraft[]): Observable<void> {
    return this.http.delete<void>(this.baseUrl).pipe(
      switchMap(() =>
        this.http.post<void>(
          this.baseUrl,
          rows.map((row) => this.clean(row)),
          {
            headers: new HttpHeaders({ Prefer: 'return=minimal' }),
          },
        ),
      ),
    );
  }

  private clean(item: EquipmentCatalogDraft): EquipmentCatalogDraft {
    return {
      sheet_name: this.blankToNull(item.sheet_name),
      measurement_quantity: this.blankToNull(item.measurement_quantity),
      equipment_name: item.equipment_name.trim(),
      price: Number(item.price) || 0,
      location: this.blankToNull(item.location),
    };
  }

  private blankToNull(value: string | number | null): string | null {
    const trimmed = value?.toString().trim() ?? '';
    return trimmed ? trimmed : null;
  }
}
