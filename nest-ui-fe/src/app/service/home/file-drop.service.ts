import { Injectable, signal } from '@angular/core';
import { FileService } from '@services/file.service';
import { NotificationService } from '@services/notification.service';
import { APP_CONFIG } from '@config/app.constants';

export interface FolderReadingPorgress {
  current: number;
  total: number;
  folderName: string;
}

@Injectable({
  providedIn: 'root',
})
export class FileDropService {
  isReadingFolder = signal(false);
  folderReadingProgress = signal<FolderReadingPorgress>({
    current: 0,
    total: 0,
    folderName: '',
  });

  constructor(
    private fileService: FileService,
    private notificationService: NotificationService,
  ) {}
  async processDroppedItems(items: DataTransferItem[]): Promise<{
    valid: File[];
    invalid: Array<{ file: File; error: string }>;
  }> {
    const allValid: File[] = [];
    const allInvalid: Array<{ file: File; error: string }> = [];

    for (const item of items) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        if (entry.isFile) {
          const file = item.getAsFile();
          if (file) {
            const result = this.validateAndAddFiles([file]);
            allValid.push(...result.valid);
            allInvalid.push(...result.invalid);
          }
        } else if (entry.isDirectory) {
          this.isReadingFolder.set(true);
          this.folderReadingProgress.set({ current: 0, total: 0, folderName: entry.name });

          try {
            const filesCount = await this.readDirectory(entry as FileSystemDirectoryEntry);
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
      console.log(`Found ${entries.length} entries in ${directoryEntry.name}`);

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          const file = await this.getFileFromEntry(fileEntry);
          if (file) {
            this.validateAndAddFiles([file]);
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
          const subFilesCount = await this.readDirectory(entry as FileSystemDirectoryEntry, false);
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

  validateAndAddFiles(files: File[]): {
    valid: File[];
    invalid: Array<{ file: File; error: string }>;
  } {
    const valid: File[] = [];
    const invalid: Array<{ file: File; error: string }> = [];

    files.forEach((file) => {
      // Usar la validación con verificación de duplicados
      const validation = this.fileService.validateFileWithDuplicateCheck(file);

      if (!validation.isValid) {
        invalid.push({ file, error: validation.error! });
      } else {
        valid.push(file);
      }
    });

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
}
