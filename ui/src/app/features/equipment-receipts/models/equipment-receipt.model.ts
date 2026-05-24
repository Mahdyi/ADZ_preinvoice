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

export function emptyEquipmentReceiptDraft(rowCount = 5): EquipmentReceiptDraft {
  return {
    header: emptyEquipmentReceiptHeader(),
    rows: Array.from({ length: rowCount }, () => emptyEquipmentReceiptRow()),
  };
}
