// nest-ui-fe/src/app/components/file-upload-area/file-upload-area.ts
import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Badge } from '@shared/badge/badge';
import { LanguageService } from '@services/language.service';

interface IndexedFile {
  file: File;
  originalIndex: number;
}

@Component({
  selector: 'app-file-upload-area',
  imports: [CommonModule, FormsModule, Button, Icon, Badge],
  templateUrl: './file-upload-area.html',
  styleUrl: './file-upload-area.css',
})
export class FileUploadArea {
  languageService = inject(LanguageService);

  // Inputs
  selectedFiles = input.required<File[]>();
  isDragging = input.required<boolean>();
  isReadingFolder = input.required<boolean>();
  folderReadingProgress = input.required<{
    folderName: string;
    current: number;
    total: number;
  }>();
  isProcessing = input.required<boolean>();
  loadedFromFolder = input.required<boolean>();

  // Inputs para el límite de tamaño
  validFilesCount = input.required<number>();
  totalValidFilesSize = input.required<string>();
  maxFileSize = input.required<string>();
  remainingSpace = input.required<string>();
  usagePercentage = input.required<number>();
  isOverLimit = input.required<boolean>();

  // Outputs
  dragEnter = output<DragEvent>();
  dragOver = output<DragEvent>();
  dragLeave = output<DragEvent>();
  drop = output<DragEvent>();
  fileSelect = output<Event>();
  removeFile = output<number>();
  clearAllFiles = output<void>();
  triggerFileInput = output<void>();
  browseFolderRecursive = output<void>();
  uploadFiles = output<void>();

  // Utility methods (passed as inputs)
  getFileExtension = input.required<(filename: string) => string>();
  formatFileSize = input.required<(bytes: number) => string>();

  // State: sort y filtro
  sortDirection = signal<'desc' | 'asc'>('desc');
  searchTerm = signal('');

  // Archivos ordenados y filtrados (mantiene el índice original para removeFile)
  sortedFiles = computed<IndexedFile[]>(() => {
    const files = this.selectedFiles();
    let indexed: IndexedFile[] = files.map((file, i) => ({ file, originalIndex: i }));

    // Filtrar por nombre
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      indexed = indexed.filter((item) => item.file.name.toLowerCase().includes(term));
    }

    // Ordenar por tamaño
    const dir = this.sortDirection();
    indexed.sort((a, b) =>
      dir === 'desc' ? b.file.size - a.file.size : a.file.size - b.file.size,
    );

    return indexed;
  });

  toggleSort(): void {
    this.sortDirection.update((d) => (d === 'desc' ? 'asc' : 'desc'));
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }
}
