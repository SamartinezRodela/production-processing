// nest-ui-fe/src/app/service/file-processing.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subscription } from 'rxjs';
import { APP_CONFIG } from '@config/app.constants';
import { ProcessingState, ProcessingResult } from '@models/processing.types';
import { NotificationService } from '@services/notification.service';
import { FileService } from '@services/file.service';
import { ApiUrlService } from '@services/api-url.service';
import { AuthService } from '@services/auth.service';
import { WebSocketService } from '@services/websocket.service';

@Injectable({
  providedIn: 'root',
})
export class FileProcessingService {
  isProcessing = signal(false);
  progress = signal(0);
  processingState = signal<ProcessingState>('idle');
  loadedFromFolder = signal(false);
  folderFileCount = signal(0);

  private intervalId?: number;
  private pythonProgressSubscription?: Subscription;
  private progressMap = new Map<string, number>();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private fileService: FileService,
    private apiUrlService: ApiUrlService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
  ) {}

  listenForPythonProgress(): void {
    this.pythonProgressSubscription = this.webSocketService
      .listen('python-progress')
      .subscribe((data: { progress: number; fileName: string }) => {
        if (data && data.fileName && this.progressMap.has(data.fileName)) {
          this.progressMap.set(data.fileName, data.progress);
          this.recalculateOverallProgress();
        }
      });
  }

  private recalculateOverallProgress(): void {
    if (this.progressMap.size === 0) {
      this.progress.set(0);
      return;
    }
    const totalProgress = Array.from(this.progressMap.values()).reduce(
      (sum, current) => sum + current,
      0,
    );
    const overallPercentage = totalProgress / this.progressMap.size;
    this.progress.set(Math.round(overallPercentage));
  }

  async processValidFiles(validFiles: any[], basePath: string, outputPath: string): Promise<any> {
    this.progressMap.clear();
    validFiles.forEach((file) => this.progressMap.set(file.FileName, 0));

    this.isProcessing.set(true);
    this.progress.set(0);
    this.processingState.set('processing');

    const errors: any[] = [];
    let processedCount = 0;
    let failedCount = 0;
    const successfulFileNames: string[] = [];
    const CONCURRENCY_LIMIT = 4;

    const token = this.authService.getToken() || undefined;
    const apiUrl = await this.apiUrlService.getApiUrl();

    for (let i = 0; i < validFiles.length; i += CONCURRENCY_LIMIT) {
      const chunk = validFiles.slice(i, i + CONCURRENCY_LIMIT);

      const chunkPromises = chunk.map(async (fileMetadata) => {
        try {
          let relativePath = fileMetadata.RelativePath || '';
          if (!relativePath.endsWith(fileMetadata.FileName)) {
            const separador = relativePath.includes('\\') ? '\\' : '/';
            relativePath = relativePath
              ? `${relativePath}${separador}${fileMetadata.FileName}`
              : fileMetadata.FileName;
          }

          let inputPath = fileMetadata.SystemPath;
          if (!inputPath) {
            const separadorBase = basePath.includes('\\') ? '\\' : '/';
            inputPath = basePath.endsWith(separadorBase)
              ? `${basePath}${relativePath}`
              : `${basePath}${separadorBase}${relativePath}`;
          }

          const datos = {
            output_path: outputPath,
            relative_path: relativePath,
            input_path: inputPath,
          };
          const result = await firstValueFrom(
            this.http.post<any>(`${apiUrl}/python/guardar-pdf-relativo`, datos),
          );

          this.progressMap.set(fileMetadata.FileName, 100);
          this.recalculateOverallProgress();

          return { success: result.success, error: result.error, fileMetadata, result };
        } catch (error: any) {
          this.progressMap.set(fileMetadata.FileName, 100);
          this.recalculateOverallProgress();
          return { success: false, error: error.message, fileMetadata, result: null };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);

      for (const res of chunkResults) {
        if (res.success) {
          processedCount++;
          successfulFileNames.push(res.fileMetadata.FileName);
        } else {
          failedCount++;
          errors.push({
            fileName: res.fileMetadata.FileName,
            error: res.error,
            timestamp: new Date(),
          });
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    this.progress.set(100);
    this.processingState.set('complete');
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.isProcessing.set(false);

    if (processedCount > 0 && failedCount === 0) {
      this.notificationService.success(`All ${processedCount} files processed successfully!`);
    } else if (processedCount > 0 && failedCount > 0) {
      this.notificationService.warning(
        `Processed ${processedCount} files. ${failedCount} files failed.`,
      );
    } else {
      this.notificationService.error(`All ${failedCount} files failed to process.`);
    }

    return {
      success: processedCount > 0,
      processedCount,
      failedCount,
      errors,
      successfulFileNames,
      timestamp: new Date(),
    };
  }

  async loadFilesFromFolder(outputPath: string): Promise<void> {
    if (!outputPath) {
      this.notificationService.warning('Please configure Output Path in Settings first');
      return;
    }

    try {
      const apiUrl = await this.apiUrlService.getApiUrl();

      const verifyResult = await firstValueFrom(
        this.http.post<any>(`${apiUrl}/pdf/verify-folder`, { path: outputPath }),
      );

      if (!verifyResult.success) {
        this.notificationService.error(
          `Error: ${verifyResult.message}\n\nPlease check your Output Path in Settings.`,
        );
        return;
      }

      this.loadedFromFolder.set(true);
      this.folderFileCount.set(verifyResult.fileCount);

      this.notificationService.success(
        `Files loaded successfully! Found ${verifyResult.fileCount} files.`,
      );
    } catch (error: any) {
      console.error('Error loading files from folder:', error);
      const errorMessage = error.error?.message || 'Failed to load files from folder';
      this.notificationService.error(errorMessage);
    }
  }

  async processFiles(): Promise<ProcessingResult> {
    const selectedFiles = this.fileService.selectedFiles();

    if (!this.loadedFromFolder() && selectedFiles.length === 0) {
      this.notificationService.warning('Please load files from folder or drag & drop files first');
      return this.createErrorResult(selectedFiles.length);
    }

    this.processingState.set('processing');
    this.isProcessing.set(true);
    this.progress.set(0);

    this.cleanup();

    try {
      this.intervalId = window.setInterval(() => {
        const currentProgress = this.progress();
        if (currentProgress < 100) {
          this.progress.set(currentProgress + 10);
        } else {
          this.cleanup();
          this.completeProcessing();
        }
      }, APP_CONFIG.PROGRESS_INTERVAL);

      return {
        success: true,
        processedCount: selectedFiles.length,
        failedCount: 0,
        errors: [],
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Error processing files:', error);
      this.notificationService.error('Failed to process files');
      this.handleProcessingError();
      return this.createErrorResult(selectedFiles.length);
    }
  }

  private completeProcessing(): void {
    this.isProcessing.set(false);
    this.progress.set(0);
    this.processingState.set('complete');
    this.notificationService.success('Files processed successfully!');
    this.loadedFromFolder.set(false);
    this.folderFileCount.set(0);
  }

  private handleProcessingError(): void {
    this.isProcessing.set(false);
    this.progress.set(0);
    this.processingState.set('error');
    this.cleanup();
  }

  private createErrorResult(fileCount: number): ProcessingResult {
    return {
      success: false,
      processedCount: 0,
      failedCount: fileCount,
      errors: [],
      timestamp: new Date(),
    };
  }

  cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    if (this.pythonProgressSubscription) {
      this.pythonProgressSubscription.unsubscribe();
    }
  }
}
