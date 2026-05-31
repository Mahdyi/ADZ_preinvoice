export interface PreinvoiceDraft {
  customer_id: number;
  preinvoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
}

export interface Preinvoice {
  id: number;
  customer_id: number;
  preinvoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
}

export interface PreinvoiceSummary {
  id: number;
  preinvoice_number: string;
  customer_id: number;
  customer_title: string;
  customer_code: string | null;
  customer_national_id: string | null;
  customer_economic_code: string | null;
  customer_postal_code: string | null;
  customer_address: string | null;
  customer_phone: string | null;
  status: string;
  issue_date: string;
  due_date: string | null;
  subtotal: string | number;
  total: string | number;
  created_at: string;
  updated_at: string;
}

export interface PreinvoiceItemDraft {
  preinvoice_id?: number;
  description: string;
  note: string | null;
  cal_position: string | null;
  quantity: number;
  unit_price: number;
}

export interface PreinvoiceItem extends PreinvoiceItemDraft {
  id: number;
  preinvoice_id: number;
  line_total: string | number;
}

export interface InvoiceRow {
  equipmentQuery: string;
  equipmentOptions: import('../../equipment/models/equipment.model').EquipmentCatalogItem[];
  selectedEquipment?: import('../../equipment/models/equipment.model').EquipmentCatalogItem | null;
  description: string;
  quantity: number;
  note: string;
  calPosition: string;
  unitPrice: number;
  measurementQuantity: string;
  location: string;
}
