import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '../shared/button/button';
import { Icon } from '../shared/icon/icon';
import { Badge } from '../shared/badge/badge';
import { PDFContainer } from '@app/models/pdf-metadata.types';
import { FileUtilsService } from '@app/service/home/file-utils.service';
import { LanguageService } from '@services/language.service';

@Component({
  selector: 'app-pdf-metadata-table',
  standalone: true,
  imports: [CommonModule, Button, Icon, Badge, FormsModule],
  templateUrl: './pdf-metadata-table.html',
  styleUrl: './pdf-metadata-table.css',
})
export class PdfMetadataTable {
  //Services
  fileUtils = inject(FileUtilsService);
  languageService = inject(LanguageService);

  //Input (datos que recibe del componente padre)
  pdfContainer = input.required<PDFContainer>();
  maxFileSize = input<number>(5 * 1024 * 1024 * 1024);

  //Outputs (eventos que emite al componente padre)
  exportMetadata = output<void>();
  clearMetadata = output<void>();
  openFileLocation = output<any>(); // Cambiado para recibir el archivo

  //State interno del componente
  currentPage = signal(1);
  itemsPerPage = signal(10);
  filterStatus = signal<'all' | 'valid' | 'invalid'>('all');
  filterInputRoot = signal<string>('');
  sortBySize = signal<'desc' | 'asc' | 'none'>('desc'); // Default: mayor a menor

  //Exponer math para el template
  Math = Math;

  //Computed  Properties
  filteredFiles = computed(() => {
    let files = [...this.pdfContainer().files];

    //Filtrar por status
    if (this.filterStatus() === 'valid') {
      files = files.filter((f) => f.Valid);
    } else if (this.filterStatus() === 'invalid') {
      files = files.filter((f) => !f.Valid);
    }

    //Filtrar por nombre de archivo
    if (this.filterInputRoot().trim()) {
      const searchTerm = this.filterInputRoot().toLowerCase();
      files = files.filter((f) => f.InputRoot.toLowerCase().includes(searchTerm));
    }

    // Ordenar por tamaño
    const sort = this.sortBySize();
    if (sort === 'desc') {
      files.sort((a, b) => b.FileSize - a.FileSize);
    } else if (sort === 'asc') {
      files.sort((a, b) => a.FileSize - b.FileSize);
    }

    return files;
  });

  paginatedFiles = computed(() => {
    const files = this.filteredFiles(); // Usar filteredFiles en lugar de filterStatus
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return files.slice(start, end);
  });

  totalPages = computed(() => {
    // Cambiar nombre de totalPage a totalPages
    return Math.ceil(this.filteredFiles().length / this.itemsPerPage());
  });

  totalFilteredFiles = computed(() => {
    return this.filteredFiles().length;
  });

  uniqueInputRoots = computed(() => {
    const roots = this.pdfContainer().files.map((f) => f.InputRoot);
    return [...new Set(roots)].sort();
  });

  //Calculos de tamaño y limite
  totalValidFilesSize = computed(() => {
    // Cambiar nombre
    const validFiles = this.pdfContainer().files.filter((f) => f.Valid);
    return validFiles.reduce((total, file) => total + file.FileSize, 0);
  });

  formattedTotalValidFilesSize = computed(() => {
    return this.fileUtils.formatFileSize(this.totalValidFilesSize());
  });

  formattedMaxFileSize = computed(() => {
    // Cambiar nombre
    return this.fileUtils.formatFileSize(this.maxFileSize());
  });

  remainingSpace = computed(() => {
    return Math.max(0, this.maxFileSize() - this.totalValidFilesSize());
  });

  formattedRemainingSpace = computed(() => {
    return this.fileUtils.formatFileSize(this.remainingSpace());
  });

  usagePercentage = computed(() => {
    if (this.maxFileSize() === 0) return 0;
    return Math.min(100, (this.totalValidFilesSize() / this.maxFileSize()) * 100);
  });

  isOverLimit = computed(() => {
    return this.totalValidFilesSize() > this.maxFileSize();
  });

  //Metodos de paginacion
  goToPage(page: number): void {
    // Agregar void
    if (page >= 1 && page <= this.totalPages()) {
      // Usar totalPages
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    // Agregar void
    if (this.currentPage() < this.totalPages()) {
      // Usar totalPages
      this.currentPage.update((p) => p + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  changeItemsPerPage(items: number): void {
    this.itemsPerPage.set(items);
    this.currentPage.set(1);
  }

  //Metodos de Filtrado

  changeStatusFilter(status: 'all' | 'valid' | 'invalid'): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
  }

  changeInputRootFilter(inputRoot: string): void {
    this.filterInputRoot.set(inputRoot);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.filterStatus.set('all');
    this.filterInputRoot.set('');
    this.sortBySize.set('desc');
    this.currentPage.set(1);
  }

  // Método para cambiar el orden por tamaño
  toggleSortBySize(): void {
    const current = this.sortBySize();
    if (current === 'desc') {
      this.sortBySize.set('asc');
    } else if (current === 'asc') {
      this.sortBySize.set('none');
    } else {
      this.sortBySize.set('desc');
    }
    this.currentPage.set(1);
  }

  // Métodos que emiten eventos al padre
  onExportMetadata(): void {
    this.exportMetadata.emit();
  }

  onClearMetadata(): void {
    this.clearMetadata.emit();
  }

  onOpenFileLocation(file: any): void {
    // Recibir el archivo como parámetro
    this.openFileLocation.emit(file);
  }

  // Método helper para formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    return this.fileUtils.formatFileSize(bytes);
  }
}
