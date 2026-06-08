import { EquipmentCatalogDraft } from './equipment.model';

export interface EquipmentImportSkippedRow {
  rowNumber: number;
  reason: string;
}

export interface EquipmentImportParseResult {
  validRows: EquipmentCatalogDraft[];
  skippedRows: EquipmentImportSkippedRow[];
  recognizedColumnCount: number;
  parser: string;
}

export type EquipmentImportProgressStatus = 'running' | 'done' | 'error';

export interface EquipmentImportProgress {
  label: string;
  status: EquipmentImportProgressStatus;
  detail?: string;
}
