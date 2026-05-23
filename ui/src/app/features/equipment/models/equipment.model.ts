export interface EquipmentCatalogItem {
  id: number;
  sheet_name: string | null;
  measurement_quantity: string | null;
  equipment_name: string;
  price: string | number;
  location: string | null;
}

export type EquipmentCatalogDraft = Omit<EquipmentCatalogItem, 'id'>;

export const emptyEquipmentCatalogDraft: EquipmentCatalogDraft = {
  sheet_name: null,
  measurement_quantity: null,
  equipment_name: '',
  price: 0,
  location: null,
};
