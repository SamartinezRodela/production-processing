// nest-ui-fe/src/app/service/file-processing.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '@config/app.constants';
import { ProcessingState, ProcessingResult } from '@models/processing.types';
import { NotificationService } from '@services/notification.service';
import { FileService } from '@services/file.service';
import { ApiUrlService } from '@services/api-url.service';

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

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private fileService: FileService,
    private apiUrlService: ApiUrlService,
  ) {}

  async loadFilesFromFolder(basePath: string): Promise<void> {
    if (!basePath) {
      this.notificationService.warning('Please configure Base Path in Settings first');
      return;
    }

    try {
      const apiUrl = await this.apiUrlService.getApiUrl();

      const verifyResult = await firstValueFrom(
        this.http.post<any>(`${apiUrl}/pdf/verify-folder`, { path: basePath }),
      );

      if (!verifyResult.success) {
        this.notificationService.error(
          `Error: ${verifyResult.message}\n\nPlease check your Base Path in Settings.`,
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
  }
}
