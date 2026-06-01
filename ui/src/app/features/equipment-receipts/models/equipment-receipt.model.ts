export interface EquipmentReceiptHeader {
  acceptanceNumber: string;
  date: string;
  time: string;
  company: string;
  followUpPerson: string;
  phone: string;
  technicalManager: string;
  address: string;
  postalCode: string;
  nationalId: string;
  technicalManagerPhone: string;
}

export interface EquipmentReceiptLookupOption {
  id: number;
  sheetName: string | null;
  measurementQuantity: string | null;
  equipmentName: string;
  location: string | null;
}

export interface EquipmentReceiptRow {
  equipmentQuery: string;
  equipmentOptions: EquipmentReceiptLookupOption[];
  selectedEquipment: EquipmentReceiptLookupOption | null;
  equipmentName: string;
  manufacturer: string;
  modelClass: string;
  requestedRange: string;
  notes: string;
}

export interface EquipmentReceiptDraft {
  header: EquipmentReceiptHeader;
  rows: EquipmentReceiptRow[];
}

export interface EquipmentReceiptRecordDraft {
  acceptance_number: string | null;
  receipt_date: string;
  receipt_time: string;
  company: string | null;
  follow_up_person: string | null;
  phone: string | null;
  technical_manager: string | null;
  address: string | null;
  postal_code: string | null;
  national_id: string | null;
  technical_manager_phone: string | null;
  status: string;
}

export interface EquipmentReceiptRecord extends EquipmentReceiptRecordDraft {
  id: number;
  created_at: string;
  updated_at: string;
}

export type EquipmentReceiptSummary = EquipmentReceiptRecord;

export interface EquipmentReceiptItemDraft {
  equipment_receipt_id?: number;
  sort_order: number;
  equipment_catalog_id: number | null;
  equipment_name: string;
  manufacturer: string | null;
  model_class: string | null;
  requested_range: string | null;
  notes: string | null;
}

export interface EquipmentReceiptItem extends EquipmentReceiptItemDraft {
  id: number;
  equipment_receipt_id: number;
}

export function emptyEquipmentReceiptHeader(): EquipmentReceiptHeader {
  const now = new Date();
  return {
    acceptanceNumber: '',
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    company: '',
    followUpPerson: '',
    phone: '',
    technicalManager: '',
    address: '',
    postalCode: '',
    nationalId: '',
    technicalManagerPhone: '',
  };
}

export function emptyEquipmentReceiptRow(): EquipmentReceiptRow {
  return {
    equipmentQuery: '',
    equipmentOptions: [],
    selectedEquipment: null,
    equipmentName: '',
    manufacturer: '',
    modelClass: '',
    requestedRange: '',
    notes: '',
  };
}

export function emptyEquipmentReceiptDraft(rowCount = 1): EquipmentReceiptDraft {
  return {
    header: emptyEquipmentReceiptHeader(),
    rows: Array.from({ length: rowCount }, () => emptyEquipmentReceiptRow()),
  };
}
