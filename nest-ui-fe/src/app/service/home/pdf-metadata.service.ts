import { Injectable, signal, inject } from '@angular/core';
import { PDFMetadata, PDFContainer, ExcludedFile } from '@models/pdf-metadata.types';
import { PdfNameValidatorService } from './pdf-name-validator.service';
import { SettingsService } from '@services/set-up/settings.service';

@Injectable({
  providedIn: 'root',
})
export class PdfMetadataService {
  private settingsService = inject(SettingsService);

  // Contenedor temporal con todos los metadatos
  private pdfContainer = signal<PDFContainer>({
    files: [],
    totalFiles: 0,
    validFiles: 0,
    invalidFiles: 0,
    excludedFiles: [],
    processedAt: new Date(),
  });

  constructor(private pdfNameValidator: PdfNameValidatorService) {}

  /**
   * Obtiene el separador de ruta según el sistema operativo
   */
  private getPathSeparator(): string {
    return this.settingsService.operatingSystem() === 'windows' ? '\\' : '/';
  }

  /**
   * Obtiene el contenedor completo
   */
  getContainer() {
    return this.pdfContainer;
  }

  /**
   * Analiza un archivo y extrae sus metadatos
   * @param file Archivo a analizar
   * @param relativePath Ruta relativa desde el drag (ej: J1C68Q_BG/M.pdf)
   * @param inputRoot Ruta raíz seleccionada por el usuario (nombre de carpeta)
   * @param systemPath Ruta absoluta del sistema (opcional)
   * @returns Metadatos del PDF
   */
  analyzePDFFile(
    file: File,
    relativePath: string,
    inputRoot: string,
    systemPath?: string,
  ): PDFMetadata {
    // Validar el nombre del archivo
    const validation = this.pdfNameValidator.validatePDFName(file.name);

    // Obtener el separador correcto según el OS
    const separator = this.getPathSeparator();

    // Normalizar la ruta relativa (convertir a separador del OS y remover el primer slash si existe)
    let normalizedRelativePath = relativePath.replace(/\\/g, separator).replace(/\//g, separator);
    if (normalizedRelativePath.startsWith(separator)) {
      normalizedRelativePath = normalizedRelativePath.substring(1);
    }

    // Calcular el ShortPath (ruta sin InputRoot)
    const shortPath = this.calculateShortPath(normalizedRelativePath, inputRoot, file.name);

    // Crear el objeto de metadatos
    const metadata: PDFMetadata = {
      FileName: file.name,
      RelativePath: normalizedRelativePath, // Ruta relativa desde el drag (ej: J1C68Q_BG\M.pdf en Windows)
      ShortPath: shortPath, // Ruta sin InputRoot (ej: M.pdf)
      InputRoot: inputRoot,
      SystemPath: systemPath, // Ruta absoluta del sistema (ej: C:\Users\...\file.pdf)
      Style: validation.style || 'N/A',
      Size: validation.size || 'N/A',
      Valid: validation.isValid,
      ValidationError: validation.error,
      FileSize: file.size,
      FileType: file.type,
    };

    return metadata;
  }

  /**
   * Agrega un archivo PDF al contenedor temporal
   * @param metadata Metadatos del PDF
   */
  addPDFToContainer(metadata: PDFMetadata): void {
    const container = this.pdfContainer();

    container.files.push(metadata);
    container.totalFiles++;

    if (metadata.Valid) {
      container.validFiles++;
    } else {
      container.invalidFiles++;
    }

    this.pdfContainer.set({ ...container });
  }

  /**
   * Agrega un archivo excluido (no-PDF) al log
   * @param fileName Nombre del archivo
   * @param relativePath Ruta relativa desde el drag
   * @param reason Razón de exclusión
   */
  addExcludedFile(fileName: string, relativePath: string, reason: string): void {
    const container = this.pdfContainer();

    container.excludedFiles.push({
      fileName,
      relativePath,
      reason,
      excludedAt: new Date(),
    });

    this.pdfContainer.set({ ...container });
  }

  /**
   * Calcula el ShortPath (ruta sin InputRoot)
   * @param relativePath Ruta relativa desde el drag (ej: J1C68Q_BG\M.pdf)
   * @param inputRoot Ruta raíz (ej: J1C68Q_BG)
   * @param fileName Nombre del archivo (fallback)
   * @returns ShortPath (ej: M.pdf)
   */
  private calculateShortPath(relativePath: string, inputRoot: string, fileName: string): string {
    // Obtener el separador correcto según el OS
    const separator = this.getPathSeparator();

    // Normalizar las rutas (usar el separador del OS)
    const normalizedRelativePath = relativePath.replace(/\\/g, separator).replace(/\//g, separator);
    const normalizedInputRoot = inputRoot.replace(/\\/g, separator).replace(/\//g, separator);

    // Dividir la ruta en segmentos
    const pathSegments = normalizedRelativePath.split(separator).filter((s) => s);

    // Encontrar el índice del InputRoot
    const rootIndex = pathSegments.findIndex((segment) => segment === normalizedInputRoot);

    if (rootIndex !== -1 && rootIndex < pathSegments.length - 1) {
      // Tomar todos los segmentos después del InputRoot
      const shortSegments = pathSegments.slice(rootIndex + 1);
      return shortSegments.join(separator);
    }

    // Si no se encuentra el InputRoot, intentar extraer desde el final
    // Buscar el fileName en la ruta y tomar todo después del InputRoot
    const fileNameWithoutExt = fileName.replace(/\\/g, separator).replace(/\//g, separator);
    const fileNameIndex = pathSegments.indexOf(fileNameWithoutExt);
    if (fileNameIndex > 0) {
      // Buscar hacia atrás desde el fileName
      for (let i = fileNameIndex - 1; i >= 0; i--) {
        if (pathSegments[i] === normalizedInputRoot) {
          const shortSegments = pathSegments.slice(i + 1);
          return shortSegments.join(separator);
        }
      }
    }

    // Si no se encuentra, retornar solo el nombre del archivo
    return fileName;
  }

  /**
   * Limpia el contenedor temporal
   */
  clearContainer(): void {
    this.pdfContainer.set({
      files: [],
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      excludedFiles: [],
      processedAt: new Date(),
    });
  }

  /**
   * Elimina un archivo del contenedor por nombre
   * @param fileName Nombre del archivo a eliminar
   */
  removeFileByName(fileName: string): void {
    const container = this.pdfContainer();
    const fileIndex = container.files.findIndex((f) => f.FileName === fileName);

    if (fileIndex !== -1) {
      const removedFile = container.files[fileIndex];
      container.files.splice(fileIndex, 1);
      container.totalFiles--;

      if (removedFile.Valid) {
        container.validFiles--;
      } else {
        container.invalidFiles--;
      }

      this.pdfContainer.set({ ...container });
    }
  }

  /**
   * Obtiene todos los archivos válidos
   */
  getValidFiles(): PDFMetadata[] {
    return this.pdfContainer().files.filter((f) => f.Valid);
  }

  /**
   * Obtiene todos los archivos inválidos
   */
  getInvalidFiles(): PDFMetadata[] {
    return this.pdfContainer().files.filter((f) => !f.Valid);
  }

  /**
   * Obtiene todos los archivos excluidos
   */
  getExcludedFiles(): ExcludedFile[] {
    return this.pdfContainer().excludedFiles;
  }

  /**
   * Exporta el contenedor a JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.pdfContainer(), null, 2);
  }
}
