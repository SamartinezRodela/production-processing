import { Component, inject } from '@angular/core';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Select } from '@shared/select/select';
import { Modal } from '@shared/modal/modal';
import { Input } from '@shared/input/input';
import { Badge } from '@shared/badge/badge';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectronService } from '@services/electron.service';
import { ThemeService } from '@services/theme.service';
import { NotificationService } from '@services/notification.service';
import { KeyboardShortcutsDirective } from '@directives/keyboard-shortcuts.directive';
import { firstValueFrom } from 'rxjs';

// Nuevos servicios
import { SettingsService } from '@services/set-up/settings.service';
import { FacilityManagementService } from '@services/set-up/facility-management.service';
import { ModalStateService } from '@services/set-up/modal-state.service';
import { AuthService } from '@services/auth.service';
import { PythonTestService } from '@services/python-test.service';

import { OrderManagementService } from '@services/order-management.service';

@Component({
  selector: 'app-set-up',
  imports: [
    CommonModule,
    Button,
    Icon,
    Select,
    Badge,
    FormsModule,
    Modal,
    Input,
    KeyboardShortcutsDirective,
  ],
  templateUrl: './set-up.html',
  styleUrl: './set-up.css',
})
export class SetUp {
  // Inject services
  private router = inject(Router);
  private electronService = inject(ElectronService);
  private notificationService = inject(NotificationService);

  orderService = inject(OrderManagementService);

  themeService = inject(ThemeService);
  settingsService = inject(SettingsService);
  facilityService = inject(FacilityManagementService);
  modalService = inject(ModalStateService);
  private authService = inject(AuthService);
  private pythonTestService = inject(PythonTestService);

  // Estado de pruebas Python
  pythonTestsRunning = false;
  pythonTestsResult: any = null;

  // Delegated getters
  get operatingSystem() {
    return this.settingsService.operatingSystem;
  }

  get basePath() {
    return this.settingsService.basePath;
  }

  get outputPath() {
    return this.settingsService.outputPath;
  }

  get autoSave() {
    return this.settingsService.autoSave;
  }

  get notifications() {
    return this.settingsService.notifications;
  }

  get facilities() {
    return this.facilityService.facilities;
  }

  get selectedFacility() {
    return this.facilityService.selectedFacility;
  }

  get facilityOptions() {
    return this.facilityService.facilityOptions();
  }

  get isModalOpen() {
    return this.modalService.isFacilityModalOpen;
  }

  get modalMode() {
    return this.modalService.facilityModalMode;
  }

  get editingFacilityName() {
    return this.modalService.editingFacilityName;
  }

  get isConfirmModalOpen() {
    return this.modalService.isConfirmModalOpen;
  }

  get confirmModalTitle() {
    return this.modalService.confirmModalTitle;
  }

  get confirmModalMessage() {
    return this.modalService.confirmModalMessage;
  }

  get confirmModalAction() {
    return this.modalService.confirmModalAction;
  }

  get modalType() {
    return this.modalService.modalType;
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

  // Verificar si los paths son defaults
  isDefaultBasePath(): boolean {
    // Comparar contra los defaults del backend
    // Nota: Esta es una verificación simplificada
    // Los defaults reales se verifican en el backend
    const path = this.basePath();
    return path ? path.includes('\\Production\\') || path.includes('/Production/') : false;
  }

  isDefaultOutputPath(): boolean {
    // Comparar contra los defaults del backend
    // Nota: Esta es una verificación simplificada
    // Los defaults reales se verifican en el backend
    const path = this.outputPath();
    return path ? path.includes('\\Production\\') || path.includes('/Production/') : false;
  }

  onOrderChange(orderId: string | number): void {
    this.orderService.setSelectedOrder(String(orderId));
  }

  // Order Management
  addOrder(): void {
    this.modalService.openFacilityModal('add', undefined, 'order');
  }

  editOrder(): void {
    const current = this.orderService.getOrderById(this.selectedOrder());
    if (current) {
      this.modalService.openFacilityModal('edit', current.name, 'order');
    }
  }

  async saveOrder(): Promise<void> {
    const name = this.editingFacilityName().trim();

    if (!name) {
      this.notificationService.warning('Order name cannot be empty');
      return;
    }

    let success = false;

    if (this.modalMode() === 'add') {
      success = await this.orderService.addOrder(name);
      if (success) {
        this.notificationService.success('Order added successfully');
      } else {
        this.notificationService.error('Failed to add order');
      }
    } else {
      success = await this.orderService.updateOrder(this.selectedOrder(), { name });
      if (success) {
        this.notificationService.success('Order updated successfully');
      } else {
        this.notificationService.error('Failed to update order');
      }
    }

    if (success) {
      this.closeModal();
    }
  }

  removeOrder(): void {
    const current = this.orderService.getOrderById(this.selectedOrder());

    if (!current) return;

    if (this.orders().length <= 1) {
      this.notificationService.warning('You must have at least one order');
      return;
    }

    this.modalService.openConfirmModal(
      'Remove Order',
      `Are you sure you want to remove "${current.name}"? This action cannot be undone.`,
      'remove-order',
    );
  }

  async confirmRemoveOrder(): Promise<void> {
    const success = await this.orderService.removeOrder(this.selectedOrder());
    if (success) {
      this.notificationService.success('Order removed successfully');
    } else {
      this.notificationService.error('Failed to remove order');
    }
    this.closeConfirmModal();
  }

  constructor() {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    // Cargar todo desde el backend (fuente única)
    const backendSettings = await this.settingsService.loadSettingsFromBackend();

    // Aplicar tema desde backend
    if (backendSettings && backendSettings.theme) {
      this.themeService.setTheme(backendSettings.theme);
    }

    // Cargar facilities desde el backend
    await this.facilityService.loadFacilities();

    // Usar selectedFacilityId del backend
    if (backendSettings && backendSettings.selectedFacilityId) {
      this.facilityService.setSelectedFacility(backendSettings.selectedFacilityId);
    }
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/']);
  }

  // OS Settings
  setOS(os: 'windows' | 'macos'): void {
    this.settingsService.setOperatingSystem(os);
  }

  async browsePath(): Promise<void> {
    try {
      //console.log('Opening folder selector for Base Path...');
      const result = await this.electronService.selectFolder();

      if (!result.canceled && result.path) {
        //console.log('Selected path:', result.path);
        //console.log('Validating Base Path (read permissions)...');

        // Validar el path antes de guardarlo
        const validation = await this.validatePath(result.path, 'read');

        //console.log('Validation result:', validation);

        if (!validation.valid) {
          console.error('Base Path validation failed:', validation.error);
          this.notificationService.error(
            `Invalid Base Path: ${validation.error}. Please select a folder with read permissions.`,
          );
          return;
        }

        //console.log('Base Path validation passed!');
        this.settingsService.setBasePath(result.path);
        this.notificationService.success(`Base Path selected: ${result.path}`);
      } else {
        //console.log('Folder selection cancelled');
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      this.notificationService.error(`Error selecting folder: ${error}`);
    }
  }

  async browseOutputPath(): Promise<void> {
    try {
      //console.log('Opening folder selector for Output Path...');
      const result = await this.electronService.selectFolder();

      if (!result.canceled && result.path) {
        //console.log('Selected path:', result.path);
        //console.log('Validating Output Path (write permissions)...');

        // Validar el path antes de guardarlo
        const validation = await this.validatePath(result.path, 'write');

        //console.log('Validation result:', validation);

        if (!validation.valid) {
          console.error('Output Path validation failed:', validation.error);
          this.notificationService.error(
            `Invalid Output Path: ${validation.error}. Please select a folder with write permissions.`,
          );
          return;
        }

        //console.log('Output Path validation passed!');
        this.settingsService.setOutputPath(result.path);
        this.notificationService.success(`Output Path selected: ${result.path}`);
      } else {
        //console.log('Folder selection cancelled');
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      this.notificationService.error(`Error selecting folder: ${error}`);
    }
  }

  private async validatePath(
    path: string,
    type: 'read' | 'write' | 'both',
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      //console.log('Sending validation request to backend...');
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      const result = await firstValueFrom(
        this.settingsService['http'].post<{
          valid: boolean;
          exists: boolean;
          canRead: boolean;
          canWrite: boolean;
          error?: string;
        }>(`${apiUrl}/settings/validate-path`, { path, type }),
      );
      //console.log('Received validation response from backend:', result);
      return result;
    } catch (error) {
      console.error('Error validating path:', error);
      return { valid: false, error: 'Failed to validate path' };
    }
  }

  // Validación cuando el usuario escribe/pega en Base Path
  async onBasePathBlur(): Promise<void> {
    const path = this.basePath().trim();

    if (!path) {
      return; // No validar si está vacío
    }

    //console.log('Validating Base Path on blur:', path);

    const validation = await this.validatePath(path, 'read');

    if (!validation.valid) {
      console.error('Base Path validation failed:', validation.error);
      this.notificationService.error(
        `Invalid Base Path: ${validation.error}. Please select a folder with read permissions.`,
      );
      // Opcional: revertir al valor anterior
      // this.settingsService.setBasePath(previousValue);
    } else {
      //console.log('Base Path validation passed!');
      this.notificationService.success('Base Path validated successfully');
    }
  }

  // Validación cuando el usuario escribe/pega en Output Path
  async onOutputPathBlur(): Promise<void> {
    const path = this.outputPath().trim();

    if (!path) {
      return; // No validar si está vacío
    }

    //console.log('Validating Output Path on blur:', path);

    const validation = await this.validatePath(path, 'write');

    if (!validation.valid) {
      console.error('Output Path validation failed:', validation.error);
      this.notificationService.error(
        `Invalid Output Path: ${validation.error}. Please select a folder with write permissions.`,
      );
      // Opcional: revertir al valor anterior
      // this.settingsService.setOutputPath(previousValue);
    } else {
      //console.log('Output Path validation passed!');
      this.notificationService.success('Output Path validated successfully');
    }
  }

  // Facility Management
  addFacility(): void {
    this.modalService.openFacilityModal('add', undefined, 'facility');
  }

  editFacility(): void {
    const current = this.facilityService.getFacilityById(this.selectedFacility());
    if (current) {
      this.modalService.openFacilityModal('edit', current.name, 'facility');
    }
  }

  async saveFacility(): Promise<void> {
    const name = this.editingFacilityName().trim();

    if (!name) {
      this.notificationService.warning('Facility name cannot be empty');
      return;
    }

    let success = false;

    if (this.modalMode() === 'add') {
      success = await this.facilityService.addFacility(name);
      if (success) {
        this.notificationService.success('Facility added successfully');
      } else {
        this.notificationService.error('Failed to add facility');
      }
    } else {
      success = await this.facilityService.updateFacility(this.selectedFacility(), name);
      if (success) {
        this.notificationService.success('Facility updated successfully');
      } else {
        this.notificationService.error('Failed to update facility');
      }
    }

    if (success) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.modalService.closeFacilityModal();
  }

  removeFacility(): void {
    const current = this.facilityService.getFacilityById(this.selectedFacility());

    if (!current) return;

    if (this.facilities().length <= 1) {
      this.notificationService.warning('You must have at least one facility');
      return;
    }

    this.modalService.openConfirmModal(
      'Remove Facility',
      `Are you sure you want to remove "${current.name}"? This action cannot be undone.`,
      'remove',
    );
  }

  async confirmRemoveFacility(): Promise<void> {
    const success = await this.facilityService.removeFacility(this.selectedFacility());
    if (success) {
      this.notificationService.success('Facility removed successfully');
    } else {
      this.notificationService.error('Failed to remove facility');
    }
    this.closeConfirmModal();
  }

  resetToDefaults(): void {
    this.modalService.openConfirmModal(
      'Reset to Defaults',
      'Are you sure you want to reset all settings to defaults? All your custom configurations will be lost.',
      'reset',
    );
  }

  async confirmResetToDefaults(): Promise<void> {
    try {
      // Resetear en el backend (copia defaultSettings a settings)
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      await firstValueFrom(this.settingsService['http'].post(`${apiUrl}/settings/reset`, {}));

      // Recargar settings desde el backend
      const backendSettings = await this.settingsService.loadSettingsFromBackend();

      // Aplicar tema desde backend
      if (backendSettings && backendSettings.theme) {
        this.themeService.setTheme(backendSettings.theme);
      }

      // Recargar facilities desde el backend
      await this.facilityService.loadFacilities();

      this.closeConfirmModal();
      this.notificationService.success('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.notificationService.error('Failed to reset settings');
    }
  }

  closeConfirmModal(): void {
    this.modalService.closeConfirmModal();
  }

  async reloadFromFile(): Promise<void> {
    await this.facilityService.reloadFacilities();
    this.notificationService.success('Facilities reloaded from file');
  }

  handleConfirmAction(): void {
    if (this.confirmModalAction() === 'remove') {
      this.confirmRemoveFacility();
    } else if (this.confirmModalAction() === 'remove-order') {
      this.confirmRemoveOrder();
    } else if (this.confirmModalAction() === 'reset') {
      this.confirmResetToDefaults();
    }
  }

  // Save Settings
  async save(): Promise<void> {
    try {
      const basePathValue = this.basePath().trim();
      const outputPathValue = this.outputPath().trim();

      // Validar Base Path antes de guardar
      if (basePathValue) {
        //console.log('Validating Base Path before save:', basePathValue);
        const basePathValidation = await this.validatePath(basePathValue, 'read');

        if (!basePathValidation.valid) {
          console.error('Base Path validation failed:', basePathValidation.error);
          this.notificationService.error(
            `Cannot save: Invalid Base Path. ${basePathValidation.error}`,
          );
          return;
        }
      }

      // Validar Output Path antes de guardar
      if (outputPathValue) {
        //console.log('Validating Output Path before save:', outputPathValue);
        const outputPathValidation = await this.validatePath(outputPathValue, 'write');

        if (!outputPathValidation.valid) {
          console.error('Output Path validation failed:', outputPathValidation.error);
          this.notificationService.error(
            `Cannot save: Invalid Output Path. ${outputPathValidation.error}`,
          );
          return;
        }
      }

      //console.log('All paths validated, saving settings...');

      // Guardar todo en el backend
      const apiUrl = await this.settingsService['apiUrlService'].getApiUrl();
      await firstValueFrom(
        this.settingsService['http'].put(`${apiUrl}/settings`, {
          basePath: basePathValue,
          outputPath: outputPathValue,
          os: this.operatingSystem(),
          selectedFacilityId: this.selectedFacility(),
          theme: this.themeService.getTheme(),
          autoSave: this.autoSave(),
          notifications: this.notifications(),
        }),
      );

      this.notificationService.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.notificationService.error('Failed to save settings');
    }
  }

  logout(): void {
    this.authService.logout();
  }

  // ==========================================
  // PRUEBAS DE BIBLIOTECAS PYTHON
  // ==========================================

  /**
   * Ejecuta la prueba rápida de todas las bibliotecas Python
   */
  async testPythonLibraries(): Promise<void> {
    // Evitar múltiples ejecuciones simultáneas
    if (this.pythonTestsRunning) {
      return;
    }

    // Usar setTimeout para TODAS las actualizaciones de estado
    setTimeout(() => {
      this.pythonTestsRunning = true;
      this.pythonTestsResult = null;
      this.notificationService.info('Testing Python libraries...');
    }, 0);

    try {
      const result = await firstValueFrom(this.pythonTestService.quickTest());

      // Actualizar estado en el siguiente ciclo
      setTimeout(() => {
        this.pythonTestsResult = result;
        this.pythonTestsRunning = false;

        // Contar bibliotecas instaladas
        const installed = Object.values(result).filter((lib: any) => lib.instalado).length;
        const total = Object.keys(result).length;

        if (installed === total) {
          this.notificationService.success(
            `All ${total} Python libraries are installed and working!`,
          );
        } else {
          this.notificationService.warning(`${installed}/${total} Python libraries are installed`);
        }
      }, 0);
    } catch (error: any) {
      console.error('Error testing Python libraries:', error);

      // Actualizar estado en el siguiente ciclo
      setTimeout(() => {
        this.notificationService.error(
          `Error testing libraries: ${error.message || 'Unknown error'}`,
        );
        this.pythonTestsResult = { error: error.message || 'Unknown error' };
        this.pythonTestsRunning = false;
      }, 0);
    }
  }

  /**
   * Navega a la página completa de pruebas Python
   */
  goToPythonTests(): void {
    this.router.navigate(['/python-tests']);
  }
}
