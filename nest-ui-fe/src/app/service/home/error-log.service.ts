import { Injectable, signal } from '@angular/core';

export interface FileError {
  fileName: string;
  error: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorLogService {
  errorLog = signal<FileError[]>([]);

  addError(fileName: string, error: string): void {
    const newError: FileError = {
      fileName,
      error,
      timestamp: new Date(),
    };
    this.errorLog.set([...this.errorLog(), newError]);
  }

  removeError(index: number): void {
    const errors = this.errorLog();
    errors.splice(index, 1);
    this.errorLog.set([...errors]);
  }

  clearErrorLog(): void {
    this.errorLog.set([]);
  }

  hasErrors(): boolean {
    return this.errorLog().length > 0;
  }

  getErrorCount(): number {
    return this.errorLog().length;
  }
}
