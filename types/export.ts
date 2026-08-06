import { FileFormat } from './archive';

export interface ExportJob {
  id: string;
  format: FileFormat;
  data: any[];
  filename: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;
  error?: string;
  createdAt: number;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errors: Array<{ row: number; message: string }>;
  data: any[];
}
