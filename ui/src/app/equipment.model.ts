export interface EquipmentCatalogItem {
  id: number;
  sheet_name: string | null;
  measurement_quantity: string | null;
  equipment_name: string;
  price: string | number;
  location: string | null;
}
