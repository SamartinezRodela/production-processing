import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FileService {
  selectedFiles = signal<File[]>([]);

  validateFile(file: File): FileValidationResult {
    if (file.size > environment.limits.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds ${environment.limits.maxFileSize / 1024 / 1024}MB limit`,
      };
    }

    if (!environment.validFileTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only PDF, PNG, JPG allowed',
      };
    }

    return { isValid: true };
  }

  // Verificar si un archivo con el mismo nombre ya existe
  isDuplicateFile(fileName: string): boolean {
    return this.selectedFiles().some((existingFile) => existingFile.name === fileName);
  }

  // Validar archivo incluyendo verificación de duplicados
  validateFileWithDuplicateCheck(file: File): FileValidationResult {
    // Primero validar tamaño y tipo
    const basicValidation = this.validateFile(file);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // Verificar duplicados
    if (this.isDuplicateFile(file.name)) {
      return {
        isValid: false,
        error: `Duplicate file: "${file.name}" already exists in the list`,
      };
    }

    return { isValid: true };
  }

  addFiles(files: File[]): void {
    this.selectedFiles.set([...this.selectedFiles(), ...files]);
  }

  removeFile(index: number): void {
    const files = this.selectedFiles();
    files.splice(index, 1);
    this.selectedFiles.set([...files]);
  }

  clearFiles(): void {
    this.selectedFiles.set([]);
  }

  getFileCount(): number {
    return this.selectedFiles().length;
  }

  getTotalSize(): number {
    return this.selectedFiles().reduce((total, file) => total + file.size, 0);
  }
}
