// nest-ui-fe/src/app/pages/home/home.ts
import { Component, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subscription } from 'rxjs';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Modal } from '@shared/modal/modal';
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
import { PdfMetadataService } from '@app/service/home/pdf-metadata.service';

import { PdfMetadataTable } from '@components/pdf-metadata-table/pdf-metadata-table';
import { FileUploadArea } from '@components/file-upload-area/file-upload-area';

// Nuevos sub-componentes de Home
import { PathConfigurationPanel } from '@components/home/path-configuration-panel/path-configuration-panel';
import { FiltersPanel } from '@components/home/filters-panel/filters-panel';
import { ProgressBars } from '@components/home/progress-bars/progress-bars';
import { ErrorLogPanel } from '@components/home/error-log-panel/error-log-panel';

// Nuevos servicios
import { FileDropService } from '@services/home/file-drop.service';
import { FileProcessingService } from '@services/home/file-processing.service';
import { ErrorLogService, FileError } from '@services/home/error-log.service';
import { PdfGenerationService } from '@services/home/pdf-generation.service';
import { FileUtilsService } from '@services/home/file-utils.service';
import { SettingsService } from '@services/set-up/settings.service';
import { PathConfigurationService } from '@app/service/home/PathConfiguration.service';
import { AuthService } from '@services/auth.service';
import { WebSocketService } from '@services/websocket.service';
import { LanguageService } from '@services/language.service';
import { FacilityManagementService } from '@services/set-up/facility-management.service';
import { OrderManagementService } from '@services/order-management.service';

import { DEFAULT_FACILITIES, DEFAULT_ORDERS } from '@app/pages/constants/facilities.constants';
import { ProcessingResult } from '@models/processing.types';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    Button,
    Icon,
    Badge,
    FormsModule,
    PdfMetadataTable,
    FileUploadArea,
    PathConfigurationPanel,
    FiltersPanel,
    ProgressBars,
    ErrorLogPanel,
    Modal,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  // Inject services
  themeService = inject(ThemeService);
  private router = inject(Router);
  private electronService = inject(ElectronService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private webSocketService = inject(WebSocketService);
  languageService = inject(LanguageService);
  facilityManagementService = inject(FacilityManagementService);

  orderService = inject(OrderManagementService);

  // Servicios públicos (usados en template)
  fileService = inject(FileService);
  folderWatcher = inject(FolderWatcherService);
  fileDropService = inject(FileDropService);
  fileProcessingService = inject(FileProcessingService);
  errorLogService = inject(ErrorLogService);
  pdfService = inject(PdfGenerationService);
  fileUtils = inject(FileUtilsService);
  pdfMetadataService = inject(PdfMetadataService);
  settingsService = inject(SettingsService);
  pathService = inject(PathConfigurationService);

  // UI State
  isDragging = signal(false);
  selectedFacility = signal<string>('1');
  ProcessType = signal<string>('1');
  // private dragLeaveTimeout: any = null;
  // private dragWatchdogTimeout: any = null; // Timeout de seguridad
  showPathWarning = signal(false);
  pathWarningDismissed = signal(false);
  isPathEditorExpanded = signal(false);
  showProcessConfirmModal = signal(false);

  // private pythonProgressSubscription!: Subscription;
  // private progressMap = new Map<string, number>();

  // Statistics
  statsResult = signal<any>(null);
  statsError = signal<string | null>(null);
  isCalculatingStats = signal(false);

  // Getter para acceder al contenedor de metadatos
  get pdfContainer() {
    return this.pdfMetadataService.getContainer();
  }

  // Obtener el límite máximo de tamaño (5GB) - usado por el componente hijo
  get maxFileSize(): number {
    return 5 * 1024 * 1024 * 1024; // 5 GB
  }

  // Getters para la sección "Files ready to process"
  get totalValidFilesSize(): number {
    const validFiles = this.pdfContainer().files.filter((f) => f.Valid);
    return validFiles.reduce((total, file) => total + file.FileSize, 0);
  }

  get formattedTotalValidFilesSize(): string {
    return this.fileUtils.formatFileSize(this.totalValidFilesSize);
  }

  get formattedMaxFileSize(): string {
    return this.fileUtils.formatFileSize(this.maxFileSize);
  }

  get validFilesCount(): number {
    return this.pdfContainer().files.filter((f) => f.Valid).length;
  }

  get remainingSpace(): number {
    return Math.max(0, this.maxFileSize - this.totalValidFilesSize);
  }

  get formattedRemainingSpace(): string {
    return this.fileUtils.formatFileSize(this.remainingSpace);
  }

  get usagePercentage(): number {
    if (this.maxFileSize === 0) return 0;
    return Math.min(100, (this.totalValidFilesSize / this.maxFileSize) * 100);
  }

  get isOverLimit(): boolean {
    return this.totalValidFilesSize > this.maxFileSize;
  }

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
    // this.preventDefaultDragBehavior();
    // this.setupKeyboardListeners();
    this.fileDropService.initGlobalDragDropListeners(this.isDragging);
    this.loadSettingsAndCheckPaths();
  }

  ngOnInit(): void {
    // Conectar el WebSocket y luego empezar a escuchar el progreso
    this.webSocketService.connect().then(() => {
      // this.listenForPythonProgress();
      this.fileProcessingService.listenForPythonProgress();
    });
  }

  // private listenForPythonProgress(): void {
  //   this.pythonProgressSubscription = this.webSocketService
  //     .listen('python-progress')
  //     .subscribe((data: { progress: number; fileName: string }) => {
  //       console.log(`📊 Progress received -> File: ${data.fileName} | ${data.progress}%`);
  //       if (data && data.fileName && this.progressMap.has(data.fileName)) {
  //         this.progressMap.set(data.fileName, data.progress);
  //         this.recalculateOverallProgress();
  //       }
  //     });
  // }

  // private recalculateOverallProgress(): void {
  //   if (this.progressMap.size === 0) {
  //     this.fileProcessingService.progress.set(0);
  //     return;
  //   }
  //   const totalProgress = Array.from(this.progressMap.values()).reduce(
  //     (sum, current) => sum + current,
  //     0,
  //   );
  //   const overallPercentage = totalProgress / this.progressMap.size;
  //   this.fileProcessingService.progress.set(Math.round(overallPercentage));
  // }

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
      const defaultSettings = await firstValueFrom(
        this.http.get<any>(`${apiUrl}/settings/default`),
      );

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

  // ==========================================
  // HELPER PARA GUARDAR METADATOS VIA BACKEND
  // ==========================================

  private async actualizarJsonMetadatos(data: any): Promise<void> {
    try {
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      await firstValueFrom(this.http.post(`${apiUrl}/python/save-metadata`, { data }));
      console.log('JSON de metadatos actualizado exitosamente');
    } catch (error) {
      // console.error('Error guardando tabla_metadatos.json', error);
      console.error('Error guardando tabla_metadatos.json o Fallo en el backend:', error);
    }
  }

  // Método para cambiar facility
  onFacilityChange(facilityId: string | number): void {
    this.selectedFacility.set(String(facilityId));
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

  // Drag & Drop handlers
  onDragOver(event: DragEvent): void {
    this.fileDropService.handleDragOver(event, this.isDragging);
  }

  onDragEnter(event: DragEvent): void {
    this.fileDropService.handleDragEnter(event, this.isDragging);
  }

  onDragLeave(event: DragEvent): void {
    this.fileDropService.handleDragLeave(event, this.isDragging);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    this.fileDropService.clearTimeouts();
    this.isDragging.set(false);

    if (event.dataTransfer?.items) {
      const items = Array.from(event.dataTransfer.items);
      const result = await this.fileDropService.processDroppedItems(items);

      // Manejar errores de validación
      result.invalid.forEach(({ file, error }) => {
        this.errorLogService.addError(file.name, error);
      });

      // Notificar al usuario
      if (result.valid.length > 0 && result.invalid.length > 0) {
        this.notificationService.warning(
          `Added ${result.valid.length} valid files. ${result.invalid.length} files excluded (invalid name format).`,
        );
      } else if (result.valid.length > 0) {
        this.notificationService.success(`Added ${result.valid.length} valid files.`);
      } else if (result.invalid.length > 0) {
        this.notificationService.error(
          `All ${result.invalid.length} files were excluded (invalid name format).`,
        );
      }
      this.actualizarJsonMetadatos(this.pdfMetadataService.getValidFiles());
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const result = this.fileDropService.validateAndAddFiles(Array.from(input.files));

      result.invalid.forEach(({ file, error }) => {
        this.errorLogService.addError(file.name, error);
      });

      // Notificar al usuario
      if (result.valid.length > 0 && result.invalid.length > 0) {
        this.notificationService.warning(
          `Added ${result.valid.length} valid files. ${result.invalid.length} files excluded (invalid name format).`,
        );
      } else if (result.valid.length > 0) {
        this.notificationService.success(`Added ${result.valid.length} valid files.`);
      } else if (result.invalid.length > 0) {
        this.notificationService.error(
          `All ${result.invalid.length} files were excluded (invalid name format).`,
        );
      }
      this.actualizarJsonMetadatos(this.pdfMetadataService.getValidFiles());
    }
  }

  // File management
  removeFile(index: number): void {
    // Obtener el nombre del archivo antes de eliminarlo
    const fileName = this.selectedFiles()[index]?.name;

    // Eliminar de selectedFiles
    this.fileService.removeFile(index);

    // Eliminar del contenedor de metadatos si existe
    if (fileName) {
      this.pdfMetadataService.removeFileByName(fileName);
    }
    this.actualizarJsonMetadatos(this.pdfMetadataService.getValidFiles());
  }

  clearAllFiles(): void {
    this.fileService.clearFiles();
    this.pdfMetadataService.clearContainer();
    this.actualizarJsonMetadatos([]);
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
  async confirmProcessFiles(): Promise<void> {
    try {
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      const defaultSettings = await firstValueFrom(
        this.http.get<any>(`${apiUrl}/settings/default`),
      );
      const basePath = this.settingsService.getBasePath();
      const outputPath = this.settingsService.getOutputPath();

      if (basePath === defaultSettings.basePath || outputPath === defaultSettings.outputPath) {
        this.notificationService.warning(
          'Please configure your Base Path and Output Path before processing files.',
        );
        this.router.navigate(['/Set-Up']);
        return;
      }
      if (this.validFilesCount === 0) {
        this.notificationService.warning('No valid files to process');
        return;
      }

      this.showProcessConfirmModal.set(true);
    } catch (error) {
      console.error('Error validating before process:', error);
    }
  }

  async uploadFiles(): Promise<ProcessingResult | void> {
    try {
      this.showProcessConfirmModal.set(false);

      // Validar paths antes de procesar
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      const defaultSettings = await firstValueFrom(
        this.http.get<any>(`${apiUrl}/settings/default`),
      );
      const basePath = this.settingsService.getBasePath();
      const outputPath = this.settingsService.getOutputPath();

      if (basePath === defaultSettings.basePath || outputPath === defaultSettings.outputPath) {
        this.notificationService.warning(
          'Please configure your Base Path and Output Path before processing files.',
        );
        this.router.navigate(['/Set-Up']);
        return;
      }

      const validFiles = this.pdfMetadataService.getValidFiles();

      if (validFiles.length === 0) {
        this.notificationService.warning('No valid files to process');
        return;
      }

      // Delegar todo el procesamiento al servicio
      const result = await this.fileProcessingService.processValidFiles(
        validFiles,
        basePath,
        outputPath,
      );

      // Limpiar la interfaz removiendo SOLO los archivos procesados con éxito
      if (result.failedCount === 0) {
        this.clearAllFiles();
      } else if (result.successfulFileNames && result.successfulFileNames.length > 0) {
        result.successfulFileNames.forEach((fileName: string) => {
          this.pdfMetadataService.removeFileByName(fileName);
          const currentFiles = this.selectedFiles();
          const index = currentFiles.findIndex((f) => f.name === fileName);
          if (index !== -1) {
            this.fileService.removeFile(index);
          }
        });
        this.actualizarJsonMetadatos(this.pdfMetadataService.getValidFiles());
      }

      return result;
    } catch (error: any) {
      console.error('Error processing files:', error);
      this.notificationService.error(`Error: ${error.message}`);
    }
  }

  async probarSaludar(): Promise<void> {
    try {
      const nombre = 'Alex';
      const token = this.authService.getToken(); // ✅ Obtener token
      const result = await this.electronService.pythonSaludar(nombre, token || undefined);

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

  exportMetadata(): void {
    const json = this.pdfMetadataService.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf-metadata-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.success('Metadata exported successfully');
  }

  clearMetadata(): void {
    this.pdfMetadataService.clearContainer();
    this.notificationService.info('Metadata cleared');
  }

  async openFileLocation(file: any): Promise<void> {
    if (!this.electronService.isElectron) {
      this.notificationService.warning('This feature is only available in Electron');
      return;
    }

    try {
      // Priorizar SystemPath si está disponible (más confiable)
      let absolutePath: string;

      if (file.SystemPath) {
        // Usar la ruta absoluta del sistema directamente
        absolutePath = file.SystemPath;
        //console.log('🔍 Opening file location (using SystemPath):', absolutePath);
      } else {
        // Fallback: Construir la ruta usando BasePath + RelativePath
        const basePath = this.settingsService.getBasePath();
        const relativePath = file.RelativePath;
        const separator = this.settingsService.operatingSystem() === 'windows' ? '\\' : '/';
        absolutePath = `${basePath}${separator}${relativePath}`;
        //console.log('🔍 Opening file location (using BasePath + RelativePath):', absolutePath);
      }

      // Llamar al IPC para abrir la carpeta del archivo
      const result = await this.electronService.showItemInFolder(absolutePath);

      if (!result.success) {
        this.notificationService.error(`Failed to open location: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error opening file location:', error);
      this.notificationService.error(`Error: ${error.message}`);
    }
  }

  // Navigation
  goToSettingPage(): void {
    this.router.navigate(['/Set-Up']);
  }

  openOutputFolder(): void {
    //console.log('Opening output folder...');
  }

  triggerFileInput(): void {
    const input = document.getElementById('fileInput') as HTMLInputElement;
    input?.click();
  }

  /**
   * Abre el selector de carpetas y explora recursivamente
   */
  async browseFolderRecursive(): Promise<void> {
    if (!this.electronService.isElectron) {
      this.notificationService.warning('This feature is only available in Electron');
      return;
    }

    try {
      const result = await this.electronService.selectFolder();

      if (!result.canceled && result.path) {
        const filesProcessed = await this.fileDropService.browseFolderRecursive(result.path);

        if (filesProcessed > 0) {
          this.notificationService.success(`Added ${filesProcessed} files from folder`);
        }
      }
    } catch (error: any) {
      console.error('Error browsing folder:', error);
      this.notificationService.error(`Error: ${error.message}`);
    }
  }

  async browseFoldersRecursive(): Promise<void> {
    if (!this.electronService.isElectron) {
      this.notificationService.warning('This feature is only available in Electron');
      return;
    }

    try {
      const result = await this.electronService.selectFolders();

      if (!result.canceled && result.paths.length > 0) {
        let totalProcessed = 0;

        for (const folderPath of result.paths) {
          const filesProcessed = await this.fileDropService.browseFolderRecursive(folderPath);
          totalProcessed += filesProcessed;
        }

        if (totalProcessed > 0) {
          this.notificationService.success(
            `Added ${totalProcessed} files from ${result.paths.length} folder(s)`,
          );
          this.actualizarJsonMetadatos(this.pdfMetadataService.getValidFiles());
        }
      }
    } catch (error: any) {
      console.error('Error browsing folders:', error);
      this.notificationService.error(`Error: ${error.message}`);
    }
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
    await this.pathService.browsePath(() => {
      this.initializeFolderWatcher();
      this.checkPathConfiguration();
    });
  }

  async browseOutputPath(): Promise<void> {
    await this.pathService.browseOutputPath(() => {
      this.initializeFolderWatcher();
      this.checkPathConfiguration();
    });
  }

  async onBasePathBlur(): Promise<void> {
    const isValid = await this.pathService.onBasePathBlur();
    if (isValid) this.checkPathConfiguration();
  }

  async onOutputPathBlur(): Promise<void> {
    const isValid = await this.pathService.onOutputPathBlur();
    if (isValid) this.checkPathConfiguration();
  }

  ///////

  async processNestOnlyPdf(): Promise<void> {
    try {
      this.showProcessConfirmModal.set(false);

      const basePath = this.settingsService.getBasePath();
      const outputPath = this.settingsService.getOutputPath();

      if (!basePath || !outputPath) {
        this.notificationService.warning('Please configure Base Path and Output Path first');
        this.router.navigate(['/Set-Up']);
        return;
      }

      const validFiles = this.pdfMetadataService.getValidFiles();
      if (validFiles.length === 0) {
        this.notificationService.warning('No valid files to process');
        return;
      }

      const separator = basePath.includes('\\') ? '\\' : '/';
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      const token = this.authService.getToken();

      const selectedFacilityId = this.selectedFacility();
      const selectedProcessId = this.orderService.selectedOrder();
      const facility = this.facilityManagementService.getFacilityById(selectedFacilityId);
      const process = this.orderService.getOrderById(selectedProcessId);

      const warehouse = facility?.warehouse || '';
      const processtype = process?.name || '';

      const items: { input: string; ref: string; output: string }[] = [];
      const skippedFileNames: string[] = []; // Para rastrear qué archivos NO borraremos

      for (const file of validFiles) {
        const input = file.SystemPath || `${basePath}${separator}${file.RelativePath}`;
        const ref = `${basePath}${separator}${warehouse}${separator}${processtype}${separator}${file.Style}${separator}${file.Size}.pdf`;
        const outputFileName = file.FileName.replace(/\.pdf$/i, '_out.pdf');

        const relativeDir = file.RelativePath
          ? file.RelativePath.substring(0, file.RelativePath.length - file.FileName.length).replace(
              /[\\\/]+$/,
              '',
            )
          : '';
        const output = relativeDir
          ? `${outputPath}${separator}${relativeDir}${separator}${outputFileName}`
          : `${outputPath}${separator}${outputFileName}`;

        // VERIFICACIÓN DE REFERENCIA
        const refExists = await this.electronService.checkFileExists(ref);
        if (!refExists) {
          skippedFileNames.push(file.FileName); // Lo marcamos para que SE QUEDE en la lista
          this.errorLogService.addError(file.FileName, `Reference file not found: ${ref}`);
          this.pdfMetadataService.updateProcessStatus(
            file.FileName,
            'skipped',
            `Reference not found: ${ref}`,
          );
          continue;
        }

        items.push({ input, ref, output });
      }

      if (items.length === 0) {
        this.notificationService.error('No files to process — all reference files are missing');
        // Actualizamos el JSON para que el usuario vea el estado "skipped" en la tabla
        this.actualizarJsonMetadatos(this.pdfMetadataService.getValidFiles());
        return;
      }

      this.fileProcessingService.isProcessing.set(true);
      this.fileProcessingService.progress.set(0);
      this.fileProcessingService.processingState.set('processing');

      const progressSub = this.webSocketService.listen('python-progress').subscribe((data: any) => {
        if (data && data.scriptName === 'nest_only_pdf') {
          this.fileProcessingService.progress.set(data.progress);
        }
      });

      const result = await firstValueFrom(
        this.http.post<any>(
          `${apiUrl}/python/nest-only-pdf-batch`,
          { items },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        ),
      );

      progressSub.unsubscribe();
      this.fileProcessingService.progress.set(100);
      this.fileProcessingService.processingState.set('complete');
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.fileProcessingService.isProcessing.set(false);

      // --- LÓGICA DE LIMPIEZA SELECTIVA (EL CAMBIO CLAVE) ---

      // 1. Identificar cuáles fueron exitosos en el backend
      const successfulInputs = result.results
        .filter((r: any) => r.status === 'fulfilled')
        .map((r: any) => r.input);

      // 2. Actualizar estados de metadatos para los resultados del backend
      result.results.forEach((r: any) => {
        const fileMatch = validFiles.find(
          (f) => (f.SystemPath || `${basePath}${separator}${f.RelativePath}`) === r.input,
        );
        if (fileMatch) {
          if (r.status === 'fulfilled') {
            this.pdfMetadataService.updateProcessStatus(fileMatch.FileName, 'success');
          } else {
            this.pdfMetadataService.updateProcessStatus(
              fileMatch.FileName,
              'failed',
              r.error?.stderr || r.error?.message || 'Processing failed',
            );
          }
        }
      });

      // 3. Obtener nombres de archivos exitosos para BORRARLOS
      const filesToRemove = validFiles
        .filter((f) => {
          const input = f.SystemPath || `${basePath}${separator}${f.RelativePath}`;
          return successfulInputs.includes(input);
        })
        .map((f) => f.FileName);

      // 4. Ejecutar la eliminación SOLO de los exitosos
      filesToRemove.forEach((fileName: string) => {
        this.pdfMetadataService.removeFileByName(fileName);
        const currentFiles = this.selectedFiles();
        const index = currentFiles.findIndex((f) => f.name === fileName);
        if (index !== -1) {
          this.fileService.removeFile(index);
        }
      });

      // 5. Los archivos en 'skippedFileNames' (como el de tu error) y los 'failed' se mantienen
      this.actualizarJsonMetadatos(this.pdfMetadataService.getValidFiles());

      if (result.success && result.failed === 0 && skippedFileNames.length === 0) {
        this.notificationService.success(`Processed ${result.completed} files successfully`);
      } else {
        this.notificationService.warning(
          `Completed: ${result.completed}. Failed: ${result.failed}. Skipped: ${skippedFileNames.length}`,
        );
      }
    } catch (error: any) {
      this.fileProcessingService.isProcessing.set(false);
      this.fileProcessingService.processingState.set('error');
      console.error('Error in nest-only-pdf batch:', error);
      this.notificationService.error(`Error: ${error.message}`);
    }
  }

  async prorbarGenerarPathPDF(): Promise<void> {
    try {
      // Obtener los default settings desde el backend
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      const defaultSettings = await firstValueFrom(
        this.http.get<any>(`${apiUrl}/settings/default`),
      );

      const outputPath = this.settingsService.getOutputPath();

      if (outputPath === defaultSettings.outputPath) {
        this.notificationService.warning(
          'Please configure your Output Path before generating PDFs.',
        );
        this.router.navigate(['/Set-Up']);
        return;
      }

      const datos = {
        titulo: 'Informe de actividad de Alex',
        contenido: 'Este es un informe generado por el sistema de Alex con python',
        autor: 'Sistema de nest ui testing',
        nombre_archivo: 'Informe de actividades.pdf',
      };
      const token = this.authService.getToken() || undefined;
      await this.pdfService.generatePDFWithPath(datos, outputPath, token);
    } catch (error) {
      console.error('Error validating output path:', error);
      this.notificationService.error('Error validating output path');
    }
  }

  async probarGuardarPdfRelativo(): Promise<void> {
    try {
      const outputPath = this.settingsService.getOutputPath();
      const basePath = this.settingsService.getBasePath();

      if (!outputPath) {
        this.notificationService.warning('Por favor configura el Output Path en Set-Up');
        return;
      }
      // Obtener solo los archivos validos del contendor
      const validFiles = this.pdfMetadataService.getValidFiles();
      if (validFiles.length === 0) {
        this.notificationService.warning('No hay archivos validos para procesar en la lista');
        return;
      }
      const token = this.authService.getToken() || undefined;

      //Recorrer los archivos y enviarlo a python
      for (const file of validFiles) {
        // 1. Tomar la ruta relativa completa
        let relativePath = file.RelativePath || '';

        // 2. Por seguridad, si el RelativePath solo era la ruta de las carpetas y no incluye el archivo, se lo agregamos:
        if (!relativePath.endsWith(file.FileName)) {
          const separador = relativePath.includes('\\') ? '\\' : '/';
          relativePath = relativePath
            ? `${relativePath}${separador}${file.FileName}`
            : file.FileName;
        }

        // 3. Determinar el input_path (Ruta absoluta original del archivo)
        let inputPath = file.SystemPath;

        // Si no tiene una ruta absoluta directa, la construimos usando el BasePath
        if (!inputPath) {
          const basePath = this.settingsService.getBasePath();
          const separadorBase = basePath.includes('\\') ? '\\' : '/';
          inputPath = basePath.endsWith(separadorBase)
            ? `${basePath}${relativePath}`
            : `${basePath}${separadorBase}${relativePath}`;
        }

        const payload = {
          output_path: outputPath,
          relative_path: relativePath,
          input_path: inputPath,
        };
        console.log(`Enviando a procesar: ${file.FileName}`, payload);

        const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
        const result = await firstValueFrom(
          this.http.post<any>(`${apiUrl}/python/guardar-pdf-relativo`, payload),
        );

        if (result.success) {
          this.notificationService.success(`Guardado en: ${result.ruta_absoluta}`);
        } else {
          this.notificationService.error(`Error guardando ${file.FileName}: ${result.error}`);
        }
      }
    } catch (error: any) {
      console.error('Error en general en comunicacion', error);
      this.notificationService.error(`Error:${error.message}`);
    }
  }

  ////////

  // Form handlers
  onProccessChange(value: string | number): void {
    this.ProcessType.set(value.toString());
  }

  logout(): void {
    this.authService.logout();
  }

  // Cleanup
  ngOnDestroy(): void {
    this.fileDropService.clearTimeouts();

    this.fileProcessingService.cleanup();
  }
}
