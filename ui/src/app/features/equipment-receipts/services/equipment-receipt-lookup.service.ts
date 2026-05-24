import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { EquipmentCatalogApiService } from '../../equipment/services/equipment-catalog-api.service';
import { EquipmentReceiptLookupOption } from '../models/equipment-receipt.model';

@Injectable({ providedIn: 'root' })
export class EquipmentReceiptLookupService {
  constructor(private readonly equipmentCatalog: EquipmentCatalogApiService) {}

  search(term: string): Observable<EquipmentReceiptLookupOption[]> {
    return this.equipmentCatalog.search(term).pipe(
      map((items) =>
        items.map((item) => ({
          id: item.id,
          sheetName: item.sheet_name,
          measurementQuantity: item.measurement_quantity,
          equipmentName: item.equipment_name,
          location: item.location,
        })),
      ),
    );
  }
}
