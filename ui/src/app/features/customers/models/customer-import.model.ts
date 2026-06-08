import { CustomerDraft } from './customer.model';

export interface CustomerImportSkippedRow {
  rowNumber: number;
  reason: string;
}

export interface CustomerImportParseResult {
  validRows: CustomerDraft[];
  skippedRows: CustomerImportSkippedRow[];
  recognizedColumnCount: number;
  parser: string;
}

export type CustomerImportProgressStatus = 'running' | 'done' | 'error';

export interface CustomerImportProgress {
  label: string;
  status: CustomerImportProgressStatus;
  detail?: string;
}
