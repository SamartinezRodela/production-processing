import { FileError } from '@services/home/error-log.service';

export type ProcessingState = 'idle' | 'loading' | 'processing' | 'complete' | 'error';
export type FacilityType = 'Facility A' | 'Facility B' | 'Facility C' | 'Facility D';

export type ProcessType = 'Order A' | 'Order B' | 'Order C' | 'Order D';

export interface ProcessingResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: FileError[];
  timestamp: Date;
}

export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  fileName?: string;
}

export interface PDFGenerationOptions {
  type: 'single' | 'multiple';
  names: string[];
  outputPath?: string;
}

export interface AppSettings {
  basePath: string;
  autoSave: boolean;
  theme: 'light' | 'dark';
  notifications: boolean;
}
