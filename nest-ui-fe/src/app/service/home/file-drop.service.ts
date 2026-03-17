import { Injectable, signal, inject } from '@angular/core';
import { FileService } from '@services/file.service';
import { NotificationService } from '@services/notification.service';
import { APP_CONFIG } from '@config/app.constants';
import { PdfMetadataService } from './pdf-metadata.service';
import { SettingsService } from '@services/set-up/settings.service';
import { ElectronService } from '@services/electron.service';

export interface FolderReadingPorgress {
  current: number;
  total: number;
  folderName: string;
}

@Injectable({
  providedIn: 'root',
})
export class FileDropService {
  private settingsService = inject(SettingsService);

  isReadingFolder = signal(false);
  folderReadingProgress = signal<FolderReadingPorgress>({
    current: 0,
    total: 0,
    folderName: '',
  });

  constructor(
    private fileService: FileService,
    private notificationService: NotificationService,
    private pdfMetadataService: PdfMetadataService,
    private electronService: ElectronService,
  ) {}

  /**
   * Obtiene el separador de ruta según el sistema operativo
   */
  private getPathSeparator(): string {
    return this.settingsService.operatingSystem() === 'windows' ? '\\' : '/';
  }
  async processDroppedItems(
    items: DataTransferItem[],
    inputRoot: string = '',
  ): Promise<{
    valid: File[];
    invalid: Array<{ file: File; error: string }>;
  }> {
    const allValid: File[] = [];
    const allInvalid: Array<{ file: File; error: string }> = [];

    // Determinar el InputRoot automáticamente si no se proporciona
    let detectedInputRoot = inputRoot;

    for (const item of items) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        // console.log('📁 Processing entry:', {
        //   name: entry.name,
        //   fullPath: entry.fullPath,
        //   isFile: entry.isFile,
        //   isDirectory: entry.isDirectory,
        // });

        // Extraer el InputRoot del primer segmento de la ruta
        if (!detectedInputRoot) {
          const pathSegments = entry.fullPath.split('/').filter((s) => s);
          detectedInputRoot = pathSegments[0] || entry.name;
          // console.log('🎯 Detected InputRoot:', detectedInputRoot, 'from segments:', pathSegments);
        }

        if (entry.isFile) {
          const file = item.getAsFile();
          if (file) {
            // Determinar la ruta a usar
            let relativeFullPath = entry.fullPath;
            let detectedRoot = detectedInputRoot;

            // Si el fullPath es solo el nombre del archivo (archivo individual arrastrado)
            // usar el systemPath para extraer la estructura correcta
            const systemPath = (file as any).path;
            if (systemPath && entry.fullPath === `/${file.name}`) {
              // Extraer la estructura desde systemPath
              const normalizedPath = systemPath.replace(/\\/g, '/');
              const segments = normalizedPath.split('/').filter((s: string) => s);

              // Obtener el separador correcto según el OS
              const separator = this.getPathSeparator();

              // Buscar los últimos 2 o 3 segmentos para construir la ruta relativa
              if (segments.length >= 3) {
                // Tomar los últimos 3 segmentos: carpeta1\carpeta2\archivo.pdf (Windows)
                const relevantSegments = segments.slice(-3);
                detectedRoot = relevantSegments[0];
                relativeFullPath = relevantSegments.join(separator);
              } else if (segments.length === 2) {
                // Tomar los últimos 2 segmentos: carpeta\archivo.pdf (Windows)
                const relevantSegments = segments.slice(-2);
                detectedRoot = relevantSegments[0];
                relativeFullPath = relevantSegments.join(separator);
              }
            } else if (systemPath) {
              // Si el fullPath tiene estructura (carpeta arrastrada)
              // verificar si necesitamos ajustar el InputRoot
              const normalizedPath = systemPath.replace(/\\/g, '/');
              const systemSegments = normalizedPath.split('/').filter((s: string) => s);
              const entrySegments = entry.fullPath.split('/').filter((s: string) => s);

              // Obtener el separador correcto según el OS
              const separator = this.getPathSeparator();

              if (entrySegments.length > 0 && systemSegments.length >= 2) {
                const firstEntrySegment = entrySegments[0];
                const entryIndexInSystem = systemSegments.indexOf(firstEntrySegment);

                if (entryIndexInSystem > 0) {
                  // El InputRoot es el segmento anterior al primer segmento del entry
                  detectedRoot = systemSegments[entryIndexInSystem - 1];
                  const relevantSegments = systemSegments.slice(entryIndexInSystem - 1);
                  relativeFullPath = relevantSegments.join(separator);
                } else {
                  // Si no encontramos el segmento, usar el primer segmento del entry
                  const pathWithoutSlash = entry.fullPath.startsWith('/')
                    ? entry.fullPath.substring(1)
                    : entry.fullPath;
                  relativeFullPath = pathWithoutSlash.replace(/\//g, separator);
                }
              }
            }

            // console.log('📄 File detected:', {
            //   fileName: file.name,
            //   systemPath: systemPath,
            //   entryFullPath: entry.fullPath,
            //   usingPath: relativeFullPath,
            //   inputRoot: detectedRoot,
            // });

            const result = this.validateAndAddFiles([file], detectedRoot, relativeFullPath);
            allValid.push(...result.valid);
            allInvalid.push(...result.invalid);
          }
        } else if (entry.isDirectory) {
          this.isReadingFolder.set(true);
          this.folderReadingProgress.set({ current: 0, total: 0, folderName: entry.name });

          try {
            const filesCount = await this.readDirectory(
              entry as FileSystemDirectoryEntry,
              detectedInputRoot,
              false,
            );
            this.notificationService.success(`Added ${filesCount} files from ${entry.name}`);
          } catch (error) {
            this.notificationService.error(`Error reading folder: ${entry.name}`);
          } finally {
            this.isReadingFolder.set(false);
          }
        }
      }
    }

    return { valid: allValid, invalid: allInvalid };
  }

  private async readDirectory(
    directoryEntry: FileSystemDirectoryEntry,
    inputRoot: string,
    isRoot: boolean = true,
  ): Promise<number> {
    const reader = directoryEntry.createReader();
    let filesFound = 0;

    const readAllEntries = async (): Promise<FileSystemEntry[]> => {
      const allEntries: FileSystemEntry[] = [];

      while (true) {
        const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });

        if (entries.length === 0) break;
        allEntries.push(...entries);
      }

      return allEntries;
    };

    try {
      const entries = await readAllEntries();
      //console.log(`Found ${entries.length} entries in ${directoryEntry.name}`);

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          const file = await this.getFileFromEntry(fileEntry);
          if (file) {
            // Obtener el separador correcto según el OS
            const separator = this.getPathSeparator();

            // El InputRoot es la carpeta que se arrastró (el primer segmento del entry.fullPath)
            const entrySegments = entry.fullPath.split('/').filter((s: string) => s);
            const finalInputRoot = entrySegments.length > 0 ? entrySegments[0] : inputRoot;

            // Construir el fullPath usando los segmentos del entry (ruta relativa desde el drag)
            const pathWithoutSlash = entry.fullPath.startsWith('/')
              ? entry.fullPath.substring(1)
              : entry.fullPath;
            const relativeFullPath = pathWithoutSlash.replace(/\//g, separator);

            this.validateAndAddFiles([file], finalInputRoot, relativeFullPath);
            filesFound++;

            if (isRoot) {
              this.folderReadingProgress.update((p) => ({
                ...p,
                current: filesFound,
                total: entries.length,
              }));
            }
          }
        } else if (entry.isDirectory) {
          const subFilesCount = await this.readDirectory(
            entry as FileSystemDirectoryEntry,
            inputRoot,
            false,
          );
          filesFound += subFilesCount;
        }
      }

      if (isRoot && filesFound > 0) {
        this.notificationService.success(`Added ${filesFound} files from ${directoryEntry.name}`);
      }

      return filesFound;
    } catch (error) {
      console.error('Error reading directory:', error);
      if (isRoot) {
        this.notificationService.error('Error reading folder contents');
      }
      return filesFound;
    }
  }

  private getFileFromEntry(fileEntry: FileSystemFileEntry): Promise<File | null> {
    return new Promise((resolve) => {
      fileEntry.file(
        (file) => resolve(file),
        (error) => {
          console.error('Error getting file', error);
          resolve(null);
        },
      );
    });
  }
  validateAndAddFiles(
    files: File[],
    inputRoot: string = '', //  Ruta raíz (primer segmento)
    relativePath: string = '', //  Ruta relativa desde el drag
  ): {
    valid: File[];
    invalid: Array<{ file: File; error: string }>;
  } {
    const valid: File[] = [];
    const invalid: Array<{ file: File; error: string }> = [];

    files.forEach((file) => {
      // Verificar si es PDF
      if (file.type !== 'application/pdf') {
        // Registrar archivo excluido (no-PDF)
        const filePath = relativePath || file.name;
        this.pdfMetadataService.addExcludedFile(
          file.name,
          filePath,
          `Not a PDF file (type: ${file.type || 'unknown'})`,
        );
        invalid.push({ file, error: 'Only PDF files are allowed' });
        return;
      }

      // Usar la validación con verificación de duplicados
      const validation = this.fileService.validateFileWithDuplicateCheck(file);

      if (!validation.isValid) {
        invalid.push({ file, error: validation.error! });
        return;
      }

      // Analizar metadatos del PDF
      const filePath = relativePath || file.name;
      const systemPath = (file as any).path; // Obtener systemPath

      const metadata = this.pdfMetadataService.analyzePDFFile(
        file,
        filePath,
        inputRoot,
        systemPath,
      );

      // Agregar al contenedor temporal
      this.pdfMetadataService.addPDFToContainer(metadata);

      // ✅ NUEVO: Solo agregar a selectedFiles si el archivo es VÁLIDO (nombre correcto)
      if (metadata.Valid) {
        valid.push(file);
      } else {
        // Archivo inválido (nombre incorrecto) - registrar en error log
        invalid.push({
          file,
          error: metadata.ValidationError || 'Invalid file name format',
        });
      }
    });

    // Solo agregar archivos válidos a selectedFiles
    if (valid.length > 0) {
      this.fileService.addFiles(valid);
    }

    return { valid, invalid };
  }

  checkDraggedFiles(dataTransfer: DataTransfer): boolean {
    if (!dataTransfer) return true;
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();

        if (entry?.isDirectory) {
          continue;
        }
        if (item.type && !APP_CONFIG.VALID_FILE_TYPES.includes(item.type)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Explora una carpeta recursivamente usando Electron API
   * @param folderPath Ruta de la carpeta a explorar
   * @returns Número de archivos procesados
   */
  async browseFolderRecursive(folderPath: string): Promise<number> {
    if (!this.electronService.isElectron) {
      this.notificationService.error('This feature is only available in Electron');
      return 0;
    }

    this.isReadingFolder.set(true);
    this.folderReadingProgress.set({
      current: 0,
      total: 0,
      folderName: folderPath.split(/[/\\]/).pop() || folderPath,
    });

    try {
      // console.log('📁 Starting recursive folder exploration:', folderPath);

      // Llamar al API de Electron para leer la carpeta recursivamente
      const result = await this.electronService.readFolderRecursive(folderPath);

      if (!result.success) {
        this.notificationService.error(`Error reading folder: ${result.error}`);
        return 0;
      }

      const files = result.files || [];
      // console.log(`📊 Found ${files.length} files in folder`);

      // Obtener el separador correcto según el OS
      const separator = this.getPathSeparator();

      // Extraer el InputRoot (nombre de la carpeta raíz)
      const pathSegments = folderPath.split(/[/\\]/).filter((s) => s);
      const inputRoot = pathSegments[pathSegments.length - 1] || 'root';

      let processedCount = 0;

      // Procesar cada archivo
      for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];

        // Actualizar progreso
        this.folderReadingProgress.update((p) => ({
          ...p,
          current: i + 1,
          total: files.length,
        }));

        // Crear un objeto File simulado desde la información del archivo
        const file = new File([], fileInfo.name, {
          type: fileInfo.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '',
        });

        // Agregar propiedades adicionales
        Object.defineProperty(file, 'size', {
          value: fileInfo.size || 0,
          writable: false,
        });

        Object.defineProperty(file, 'path', {
          value: fileInfo.path,
          writable: false,
        });

        // Construir la ruta relativa desde el InputRoot
        const fileRelativePath = fileInfo.path.replace(folderPath, '').replace(/^[/\\]/, '');
        const relativePath = `${inputRoot}${separator}${fileRelativePath}`;

        // console.log('📄 Processing file:', {
        //   fileName: file.name,
        //   systemPath: fileInfo.path,
        //   relativePath: relativePath,
        //   inputRoot: inputRoot,
        // });

        // Validar y agregar el archivo
        const result = this.validateAndAddFiles([file], inputRoot, relativePath);

        if (result.valid.length > 0) {
          processedCount++;
        }
      }

      this.notificationService.success(
        `Successfully processed ${processedCount} files from ${files.length} total files`,
      );

      return processedCount;
    } catch (error: any) {
      console.error('Error browsing folder recursively:', error);
      this.notificationService.error(`Error: ${error.message}`);
      return 0;
    } finally {
      this.isReadingFolder.set(false);
    }
  }
}
