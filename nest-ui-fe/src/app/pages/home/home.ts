// nest-ui-fe/src/app/pages/home/home.ts
import { Component, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Select, SelectOption } from '@shared/select/select';
import { Badge } from '@shared/badge/badge';
import { Input } from '@shared/input/input';
import { Router } from '@angular/router';
import { ElectronService } from '@services/electron.service';
import { ThemeService } from '@services/theme.service';
import { inject } from '@angular/core';
import { FileService } from '@services/file.service';
import { NotificationService } from '@services/notification.service';
import { FolderWatcherService } from '@services/folder-watcher.service';

// Nuevos servicios
import { FileDropService } from '@services/home/file-drop.service';
import { FileProcessingService } from '@services/home/file-processing.service';
import { ErrorLogService } from '@services/home/error-log.service';
import { PdfGenerationService } from '@services/home/pdf-generation.service';
import { FileUtilsService } from '@services/home/file-utils.service';
import { SettingsService } from '@services/set-up/settings.service';
import { AuthService } from '@services/auth.service';

import { DEFAULT_FACILITIES, DEFAULT_ORDERS } from '../constants/facilities.constants';
import { ProcessingResult } from '@models/processing.types';
import { OrderManagementService } from '@services/order-management.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, Button, Icon, Select, Badge, Input, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnDestroy {
  // Inject services
  themeService = inject(ThemeService);
  private router = inject(Router);
  private electronService = inject(ElectronService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  orderService = inject(OrderManagementService);

  // Servicios públicos (usados en template)
  fileService = inject(FileService);
  folderWatcher = inject(FolderWatcherService);
  fileDropService = inject(FileDropService);
  fileProcessingService = inject(FileProcessingService);
  errorLogService = inject(ErrorLogService);
  pdfService = inject(PdfGenerationService);
  fileUtils = inject(FileUtilsService);
  private settingsService = inject(SettingsService);

  // UI State
  isDragging = signal(false);
  selectedFacility = signal<string>('1');
  ProcessType = signal<string>('1');
  private dragLeaveTimeout: any = null;
  private dragWatchdogTimeout: any = null; // Timeout de seguridad
  showPathWarning = signal(false);
  pathWarningDismissed = signal(false);
  isPathEditorExpanded = signal(false);

  // Statistics
  statsResult = signal<any>(null);
  statsError = signal<string | null>(null);
  isCalculatingStats = signal(false);

  // Computed properties
  get facilityOptions(): SelectOption[] {
    return DEFAULT_FACILITIES.map((facility) => ({
      value: facility.id,
      label: facility.name,
    }));
  }

  get processOptions(): SelectOption[] {
    return DEFAULT_ORDERS.map((order) => ({
      value: order.id,
      label: order.name,
    }));
  }

  // Delegated getters from services
  get selectedFiles() {
    return this.fileService.selectedFiles;
  }

  get orders() {
    return this.orderService.orders;
  }

  get selectedOrder() {
    return this.orderService.selectedOrder;
  }

  get orderOptions() {
    return this.orderService.orderOptions();
  }

  // Método para cambiar order
  onOrderChange(orderId: string | number): void {
    this.orderService.setSelectedOrder(String(orderId));
    // Aquí puedes agregar lógica adicional cuando cambie el order
  }

  get isReadingFolder() {
    return this.fileDropService.isReadingFolder;
  }

  get folderReadingProgress() {
    return this.fileDropService.folderReadingProgress;
  }

  get errorLog() {
    return this.errorLogService.errorLog;
  }

  get isProcessing() {
    return this.fileProcessingService.isProcessing;
  }

  get progress() {
    return this.fileProcessingService.progress;
  }

  get processingState() {
    return this.fileProcessingService.processingState;
  }

  get loadedFromFolder() {
    return this.fileProcessingService.loadedFromFolder;
  }

  get folderFileCount() {
    return this.fileProcessingService.folderFileCount;
  }

  get isGeneratingPDF() {
    return this.pdfService.isGeneratingPDF;
  }

  get pdfProgress() {
    return this.pdfService.pdfProgress;
  }

  get isPDFModalOpen() {
    return this.pdfService.isPDFModalOpen;
  }

  get pdfGenerationType() {
    return this.pdfService.pdfGenerationType;
  }

  get singlePDFName() {
    return this.pdfService.singlePDFName;
  }

  get multiplePDFNames() {
    return this.pdfService.multiplePDFNames;
  }

  get folderItems() {
    return this.folderWatcher.items;
  }

  get folderPath() {
    return this.folderWatcher.path;
  }

  get breadcrumbs() {
    return this.folderWatcher.breadcrumbPath;
  }

  constructor() {
    this.initializeFolderWatcher();
    this.preventDefaultDragBehavior();
    this.setupKeyboardListeners();
    this.loadSettingsAndCheckPaths();
  }

  private async loadSettingsAndCheckPaths(): Promise<void> {
    // Cargar settings desde el backend
    await this.settingsService.loadSettingsFromBackend();

    // Verificar configuración de paths
    this.checkPathConfiguration();
  }

  private async checkPathConfiguration(): Promise<void> {
    try {
      // Obtener los default settings desde el backend
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      const response = await fetch(`${apiUrl}/settings/default`);
      const defaultSettings = await response.json();

      const basePath = this.settingsService.getBasePath();
      const outputPath = this.settingsService.getOutputPath();

      // Verificar si los paths actuales son iguales a los defaults
      const isDefaultBasePath = basePath === defaultSettings.basePath;
      const isDefaultOutputPath = outputPath === defaultSettings.outputPath;

      if ((isDefaultBasePath || isDefaultOutputPath) && !this.pathWarningDismissed()) {
        this.showPathWarning.set(true);
        // Auto-expandir el editor si los paths son defaults
        this.isPathEditorExpanded.set(true);
      } else {
        this.showPathWarning.set(false);
      }
    } catch (error) {
      console.error('Error checking path configuration:', error);
    }
  }

  togglePathEditor(): void {
    this.isPathEditorExpanded.set(!this.isPathEditorExpanded());
  }

  dismissPathWarning(): void {
    this.showPathWarning.set(false);
    this.pathWarningDismissed.set(true);
    // Guardar en localStorage para no mostrar de nuevo en esta sesión
    localStorage.setItem('pathWarningDismissed', 'true');
  }

  private async initializeFolderWatcher(): Promise<void> {
    if (!this.electronService.isElectron) {
      console.warn('Folder watcher only works in Electron');
      return;
    }
    const outputPath = this.settingsService.getOutputPath();
    if (outputPath) {
      // Validar que el path existe antes de iniciar el watcher
      const result = await this.electronService.readFolder(outputPath);
      if (result.success) {
        await this.folderWatcher.startWatching(outputPath);
      } else {
        console.warn(
          'Output path does not exist, skipping folder watcher initialization:',
          outputPath,
        );
      }
    }
  }

  // Configurar listeners de teclado
  private setupKeyboardListeners(): void {
    // Detectar cuando el usuario presiona ESC para cancelar el drag
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isDragging()) {
        this.isDragging.set(false);
        console.log('Drag cancelled with ESC');
      }
    });
  }

  // Prevenir comportamiento por defecto del navegador para drag & drop
  private preventDefaultDragBehavior(): void {
    // Prevenir que el navegador abra archivos arrastrados
    window.addEventListener(
      'dragover',
      (e: DragEvent) => {
        e.preventDefault();
      },
      false,
    );

    window.addEventListener(
      'drop',
      (e: DragEvent) => {
        e.preventDefault();
      },
      false,
    );

    // Detectar cuando el drag termina globalmente (incluso fuera del área)
    window.addEventListener(
      'dragend',
      () => {
        this.isDragging.set(false);
        console.log('Drag ended globally');
      },
      false,
    );

    // Detectar cuando el mouse sale de la ventana completamente
    window.addEventListener(
      'dragleave',
      (e: DragEvent) => {
        // Si el relatedTarget es null, significa que salió de la ventana
        if (!e.relatedTarget) {
          this.isDragging.set(false);
          console.log('Drag left window');
        }
      },
      false,
    );
  }

  // Drag & Drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Cancelar el timeout de dragLeave si existe
    if (this.dragLeaveTimeout) {
      clearTimeout(this.dragLeaveTimeout);
      this.dragLeaveTimeout = null;
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'; // Forzar 'copy' siempre
      const hasValidFiles = this.fileDropService.checkDraggedFiles(event.dataTransfer);
      this.isDragging.set(hasValidFiles);
    }
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'; // Forzar 'copy' siempre
      const hasValidFiles = this.fileDropService.checkDraggedFiles(event.dataTransfer);
      if (hasValidFiles) {
        this.isDragging.set(true);

        // Iniciar watchdog: si después de 5 segundos aún está dragging, forzar desactivación
        if (this.dragWatchdogTimeout) {
          clearTimeout(this.dragWatchdogTimeout);
        }
        this.dragWatchdogTimeout = setTimeout(() => {
          if (this.isDragging()) {
            this.isDragging.set(false);
            console.warn('Drag watchdog: Forced deactivation after 5s');
          }
        }, 5000); // 5 segundos
      }
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Limpiar timeout anterior si existe
    if (this.dragLeaveTimeout) {
      clearTimeout(this.dragLeaveTimeout);
    }

    // Capturar los valores ANTES del timeout (porque se pierden después)
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    // Usar timeout más corto para respuesta más rápida
    this.dragLeaveTimeout = setTimeout(() => {
      // Verificar que currentTarget no sea null
      if (!currentTarget) {
        this.isDragging.set(false);
        console.log('Drag left (no currentTarget)');
        return;
      }

      // Si no hay relatedTarget o el relatedTarget no está dentro del currentTarget
      if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
        this.isDragging.set(false);
        console.log('Drag left the area');
      }
    }, 10);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    // Limpiar timeouts si existen
    if (this.dragLeaveTimeout) {
      clearTimeout(this.dragLeaveTimeout);
      this.dragLeaveTimeout = null;
    }
    if (this.dragWatchdogTimeout) {
      clearTimeout(this.dragWatchdogTimeout);
      this.dragWatchdogTimeout = null;
    }

    this.isDragging.set(false);

    console.log('Drop event captured!', event.dataTransfer);

    if (event.dataTransfer?.items) {
      const items = Array.from(event.dataTransfer.items);
      const result = await this.fileDropService.processDroppedItems(items);

      // Manejar errores de validación
      result.invalid.forEach(({ file, error }) => {
        this.errorLogService.addError(file.name, error);
      });
    } else if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      const result = this.fileDropService.validateAndAddFiles(files);

      result.invalid.forEach(({ file, error }) => {
        this.errorLogService.addError(file.name, error);
      });
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const result = this.fileDropService.validateAndAddFiles(Array.from(input.files));

      result.invalid.forEach(({ file, error }) => {
        this.errorLogService.addError(file.name, error);
      });
    }
  }

  // File management
  removeFile(index: number): void {
    this.fileService.removeFile(index);
  }

  clearAllFiles(): void {
    this.fileService.clearFiles();
  }

  // Error management
  clearErrorLog(): void {
    this.errorLogService.clearErrorLog();
  }

  removeError(index: number): void {
    this.errorLogService.removeError(index);
  }

  // File processing
  async loadFilesFromFolder(): Promise<void> {
    const outputPath = this.settingsService.getOutputPath();

    if (!outputPath) {
      this.notificationService.warning('Please configure Output Path in Settings first');
      this.router.navigate(['/Set-Up']);
      return;
    }

    await this.fileProcessingService.loadFilesFromFolder(outputPath);
  }

  async uploadFiles(): Promise<ProcessingResult> {
    try {
      // Obtener los default settings desde el backend
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      const response = await fetch(`${apiUrl}/settings/default`);
      const defaultSettings = await response.json();

      // Validar paths antes de procesar
      const basePath = this.settingsService.getBasePath();
      const outputPath = this.settingsService.getOutputPath();

      const isDefaultBasePath = basePath === defaultSettings.basePath;
      const isDefaultOutputPath = outputPath === defaultSettings.outputPath;

      if (isDefaultBasePath || isDefaultOutputPath) {
        this.notificationService.warning(
          'Please configure your Base Path and Output Path before processing files.',
        );
        this.router.navigate(['/Set-Up']);
        return {
          success: false,
          processedCount: 0,
          failedCount: 0,
          errors: [],
          timestamp: new Date(),
        };
      }

      return await this.fileProcessingService.processFiles();
    } catch (error) {
      console.error('Error validating paths:', error);
      return {
        success: false,
        processedCount: 0,
        failedCount: 0,
        errors: [],
        timestamp: new Date(),
      };
    }
  }

  // PDF Generation
  openPDFModal(): void {
    this.pdfService.openModal();
  }

  closePDFModal(): void {
    this.pdfService.closeModal();
  }

  setPDFGenerationType(type: 'single' | 'multiple'): void {
    this.pdfService.setGenerationType(type);
  }

  addPDFName(): void {
    this.pdfService.addPDFName();
  }

  removePDFName(index: number): void {
    this.pdfService.removePDFName(index);
  }

  async prorbarGenerarPDF(): Promise<void> {
    const datos = {
      titulo: 'Iforme de actividad de Alex',
      contenido: 'Este es un informe generado por el sistema de Alex con python',
      autor: 'Sistem de nest ui testing',
      nombre_archivo: 'Informe de actividades.pdf',
    };
    await this.pdfService.generatePDF(datos);
  }

  async prorbarGenerarPathPDF(): Promise<void> {
    try {
      // Obtener los default settings desde el backend
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      const response = await fetch(`${apiUrl}/settings/default`);
      const defaultSettings = await response.json();

      const outputPath = this.settingsService.getOutputPath();

      // Validar si es el path por defecto
      const isDefaultOutputPath = outputPath === defaultSettings.outputPath;

      if (isDefaultOutputPath) {
        this.notificationService.warning(
          'Please configure your Output Path before generating PDFs.',
        );
        this.router.navigate(['/Set-Up']);
        return;
      }

      const datos = {
        titulo: 'Iforme de actividad de Alex',
        contenido: 'Este es un informe generado por el sistema de Alex con python',
        autor: 'Sistem de nest ui testing',
        nombre_archivo: 'Informe de actividades.pdf',
      };
      await this.pdfService.generatePDFWithPath(datos, outputPath);
    } catch (error) {
      console.error('Error validating output path:', error);
      this.notificationService.error('Error validating output path');
    }
  }

  async probarSaludar(): Promise<void> {
    try {
      const nombre = 'Alex';
      const result = await this.electronService.pythonSaludar(nombre);

      if (result.success) {
        this.notificationService.success(result.mensaje);
      } else {
        this.notificationService.error(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error en la llamada a Python:', error);
      this.notificationService.error(`Error: ${error.message}`);
    }
  }

  // Navigation
  goToSettingPage(): void {
    this.router.navigate(['/Set-Up']);
  }

  openOutputFolder(): void {
    console.log('Opening output folder...');
  }

  triggerFileInput(): void {
    const input = document.getElementById('fileInput') as HTMLInputElement;
    input?.click();
  }

  // Folder navigation
  getFolderCount(): number {
    return this.folderWatcher.getFolderCount();
  }

  getFileCount(): number {
    return this.folderWatcher.getFileCount();
  }

  async refreshFolder(): Promise<void> {
    await this.folderWatcher.refresh();
    this.notificationService.info('Folder refreshed');
  }

  async navigateToFolder(folderPath: string): Promise<void> {
    await this.folderWatcher.loadFolderContents(folderPath);
  }

  async navigateUp(): Promise<void> {
    if (this.folderWatcher.canNavigateUp()) {
      await this.folderWatcher.navigateUp();
    }
  }

  async navigateToBreadcrumb(breadcrumbPath: string): Promise<void> {
    await this.folderWatcher.navigateToBreadcrumb(breadcrumbPath);
  }

  canNavigateUp(): boolean {
    return this.folderWatcher.canNavigateUp();
  }

  // Utility methods
  getFileExtension(filename: string): string {
    return this.fileUtils.getFileExtension(filename);
  }

  formatFileSize(bytes: number): string {
    return this.fileUtils.formatFileSize(bytes);
  }

  // Path management (delegated to SettingsService)
  get basePath() {
    return this.settingsService.basePath;
  }

  get outputPath() {
    return this.settingsService.outputPath;
  }

  async browsePath(): Promise<void> {
    try {
      console.log('🔍 Opening folder selector for Base Path...');
      const result = await this.electronService.selectFolder();

      if (!result.canceled && result.path) {
        console.log('📁 Selected path:', result.path);
        console.log('🔐 Validating Base Path (read permissions)...');

        // Validar el path antes de guardarlo
        const validation = await this.validatePath(result.path, 'read');

        console.log('📊 Validation result:', validation);

        if (!validation.valid) {
          console.error('❌ Base Path validation failed:', validation.error);
          this.notificationService.error(
            `Invalid Base Path: ${validation.error}. Please select a folder with read permissions.`,
          );
          return;
        }

        console.log('✅ Base Path validation passed!');
        this.settingsService.setBasePath(result.path);
        await this.savePathSettings();
        this.notificationService.success(`Base Path updated: ${result.path}`);

        // Recargar folder watcher si es necesario
        await this.initializeFolderWatcher();
      } else {
        console.log('❌ Folder selection cancelled');
      }
    } catch (error) {
      console.error('💥 Error selecting folder:', error);
      this.notificationService.error(`Error selecting folder: ${error}`);
    }
  }

  async browseOutputPath(): Promise<void> {
    try {
      console.log('🔍 Opening folder selector for Output Path...');
      const result = await this.electronService.selectFolder();

      if (!result.canceled && result.path) {
        console.log('📁 Selected path:', result.path);
        console.log('🔐 Validating Output Path (write permissions)...');

        // Validar el path antes de guardarlo
        const validation = await this.validatePath(result.path, 'write');

        console.log('📊 Validation result:', validation);

        if (!validation.valid) {
          console.error('❌ Output Path validation failed:', validation.error);
          this.notificationService.error(
            `Invalid Output Path: ${validation.error}. Please select a folder with write permissions.`,
          );
          return;
        }

        console.log('✅ Output Path validation passed!');
        this.settingsService.setOutputPath(result.path);
        await this.savePathSettings();
        this.notificationService.success(`Output Path updated: ${result.path}`);

        // Recargar folder watcher con el nuevo path
        await this.initializeFolderWatcher();
      } else {
        console.log('❌ Folder selection cancelled');
      }
    } catch (error) {
      console.error('💥 Error selecting folder:', error);
      this.notificationService.error(`Error selecting folder: ${error}`);
    }
  }

  async onBasePathBlur(): Promise<void> {
    const path = this.settingsService.basePath().trim();

    if (!path) {
      return; // No validar si está vacío
    }

    console.log('🔍 Validating Base Path on blur:', path);

    const validation = await this.validatePath(path, 'read');

    if (!validation.valid) {
      console.error('❌ Base Path validation failed:', validation.error);
      this.notificationService.error(
        `Invalid Base Path: ${validation.error}. Please select a folder with read permissions.`,
      );
    } else {
      console.log('✅ Base Path validation passed!');
      await this.savePathSettings();
      this.notificationService.success('Base Path validated and saved');
    }
  }

  async onOutputPathBlur(): Promise<void> {
    const path = this.settingsService.outputPath().trim();

    if (!path) {
      return; // No validar si está vacío
    }

    console.log('🔍 Validating Output Path on blur:', path);

    const validation = await this.validatePath(path, 'write');

    if (!validation.valid) {
      console.error('❌ Output Path validation failed:', validation.error);
      this.notificationService.error(
        `Invalid Output Path: ${validation.error}. Please select a folder with write permissions.`,
      );
    } else {
      console.log('✅ Output Path validation passed!');
      await this.savePathSettings();
      this.notificationService.success('Output Path validated and saved');
    }
  }

  private async validatePath(
    path: string,
    type: 'read' | 'write' | 'both',
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      console.log('🌐 Sending validation request to backend...');
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      const result = await fetch(`${apiUrl}/settings/validate-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, type }),
      }).then((res) => res.json());

      console.log('📥 Received validation response from backend:', result);
      return result;
    } catch (error) {
      console.error('💥 Error validating path:', error);
      return { valid: false, error: 'Failed to validate path' };
    }
  }

  private async savePathSettings(): Promise<void> {
    try {
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      await fetch(`${apiUrl}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePath: this.settingsService.basePath(),
          outputPath: this.settingsService.outputPath(),
          os: this.settingsService.operatingSystem(),
        }),
      });

      // Actualizar el warning si es necesario
      this.checkPathConfiguration();
    } catch (error) {
      console.error('Error saving path settings:', error);
    }
  }

  // Form handlers
  onFacilityChange(value: string | number): void {
    this.selectedFacility.set(value.toString());
  }

  onProccessChange(value: string | number): void {
    this.ProcessType.set(value.toString());
  }

  logout(): void {
    this.authService.logout();
  }

  // Cleanup
  ngOnDestroy(): void {
    // Limpiar timeouts si existen
    if (this.dragLeaveTimeout) {
      clearTimeout(this.dragLeaveTimeout);
    }
    if (this.dragWatchdogTimeout) {
      clearTimeout(this.dragWatchdogTimeout);
    }

    this.fileProcessingService.cleanup();
    this.folderWatcher.stopWatching();
  }
}
