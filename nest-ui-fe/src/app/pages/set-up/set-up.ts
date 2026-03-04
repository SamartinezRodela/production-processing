import { Component, inject } from '@angular/core';
import { Button } from '../../components/shared/button/button';
import { Icon } from '../../components/shared/icon/icon';
import { Select } from '../../components/shared/select/select';
import { Modal } from '../../components/shared/modal/modal';
import { Input } from '../../components/shared/input/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectronService } from '../../service/electron.service';
import { ThemeService } from '../../service/theme.service';
import { NotificationService } from '../../service/notification.service';
import { KeyboardShortcutsDirective } from '../../directives/keyboard-shortcuts.directive';

// Nuevos servicios
import { SettingsService } from '../../service/set-up/settings.service';
import { FacilityManagementService } from '../../service/set-up/facility-management.service';
import { ModalStateService } from '../../service/set-up/modal-state.service';
import { AuthService } from '../../service/auth.service';

import { OrderManagementService } from '../../service/order-management.service';

@Component({
  selector: 'app-set-up',
  imports: [
    CommonModule,
    Button,
    Icon,
    Select,
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

  // Delegated getters
  get operatingSystem() {
    return this.settingsService.operatingSystem;
  }

  get basePath() {
    return this.settingsService.basePath;
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
    const settings = this.settingsService.loadSettings();

    // Cargar facilities desde el backend
    await this.facilityService.loadFacilities();

    // Si hay un facility seleccionado guardado, usarlo
    if (settings && settings.selectedFacility) {
      this.facilityService.setSelectedFacility(settings.selectedFacility);
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
      const result = await this.electronService.selectFolder();

      if (!result.canceled && result.path) {
        this.settingsService.setBasePath(result.path);
        this.notificationService.success(`Nueva ruta seleccionada: ${result.path}`);
      }
    } catch (error) {
      console.error('Error al seleccionar carpeta:', error);
      this.notificationService.error(`Error al seleccionar carpeta: ${error}`);
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
    this.settingsService.resetToDefault();

    // Recargar facilities desde el backend (que ahora tendrá los defaults)
    await this.facilityService.loadFacilities();

    this.themeService.setTheme('light');
    this.closeConfirmModal();
    this.notificationService.success('Settings reset to defaults');
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
  save(): void {
    const settings = {
      os: this.operatingSystem(),
      basePath: this.basePath(),
      selectedFacility: this.selectedFacility(),
      facilities: this.facilities(),
      autoSave: this.autoSave(),
      notifications: this.notifications(),
      theme: this.themeService.getTheme(),
    };

    this.settingsService.saveSettings(settings);
    this.notificationService.success('Settings saved successfully!');
  }

  logout(): void {
    this.authService.logout();
  }
}
