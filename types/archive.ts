export enum FileFormat {
  JSON = 'JSON',
  TXT = 'TXT',
  XLSX = 'XLSX',
  PDF = 'PDF',
  ZIP = 'ZIP'
}

export enum DocumentType {
  RECEIPT = 'RECEIPT',
  INVOICE = 'INVOICE',
  TICKET = 'TICKET',
  REPLENISHMENT = 'REPLENISHMENT',
  REPORT = 'REPORT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  OTHER = 'OTHER'
}

export interface ArchiveMetadata {
  id: string; // e.g. "ARC-2026-0001"
  userId: string;
  depotId?: string; // If multi-depot is implemented
  documentType: DocumentType;
  documentId?: string; // Original ID of the entity (e.g. SALE-123)
  fileName: string;
  fileFormat: FileFormat;
  storagePath?: string; // URL or local path reference
  sizeBytes?: number;
  createdAt: number;
  updatedAt: number;
  archivedAt: number;
  createdBy: string;
  isSynced: boolean;
}

export interface ArchiveCategory {
  id: DocumentType;
  label: string;
  color: string;
  icon: string;
}

export interface DocumentReference {
  id: string;
  type: DocumentType;
  data: any;
}
