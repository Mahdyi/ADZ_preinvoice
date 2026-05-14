import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { EquipmentCatalogItem } from './equipment.model';

@Injectable({ providedIn: 'root' })
export class EquipmentApiService {
  private readonly baseUrl = `${environment.apiUrl}/equipment_catalog`;

  constructor(private readonly http: HttpClient) {}

  search(term = ''): Observable<EquipmentCatalogItem[]> {
    let params = new HttpParams()
      .set('select', '*')
      .set('order', 'equipment_name.asc')
      .set('limit', '30');

    const cleaned = term.trim();
    if (cleaned) {
      params = params.set('or', `(equipment_name.ilike.*${cleaned}*,sheet_name.ilike.*${cleaned}*,measurement_quantity.ilike.*${cleaned}*,location.ilike.*${cleaned}*)`);
    }

    return this.http.get<EquipmentCatalogItem[]>(this.baseUrl, { params });
  }
}
