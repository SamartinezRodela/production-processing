import { Injectable, signal } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class ModalStateService {
  //Facility Modal
  isFacilityModalOpen = signal(false);
  facilityModalMode = signal<'add' | 'edit'>('add');
  editingFacilityName = signal('');
  editingFacilityWarehouse = signal('');
  modalType = signal<'facility' | 'order'>('facility'); // ✅ NUEVO

  //Confirmation Modal
  isConfirmModalOpen = signal(false);
  confirmModalTitle = signal('');
  confirmModalMessage = signal('');
  confirmModalAction = signal<'remove' | 'remove-order' | 'reset'>('remove');

  openFacilityModal(
    mode: 'add' | 'edit',
    currentName?: string,
    type: 'facility' | 'order' = 'facility',
    currentWarehouse?: string,
  ): void {
    this.facilityModalMode.set(mode);
    this.editingFacilityName.set(currentName || '');
    this.editingFacilityWarehouse.set(currentWarehouse || '');
    this.modalType.set(type);
    this.isFacilityModalOpen.set(true);
  }

  closeFacilityModal(): void {
    this.isFacilityModalOpen.set(false);
    this.editingFacilityName.set('');
    this.editingFacilityWarehouse.set('');
  }

  openConfirmModal(
    title: string,
    message: string,
    action: 'remove' | 'remove-order' | 'reset',
  ): void {
    this.confirmModalTitle.set(title);
    this.confirmModalMessage.set(message);
    this.confirmModalAction.set(action);
    this.isConfirmModalOpen.set(true);
  }
  closeConfirmModal(): void {
    this.isConfirmModalOpen.set(false);
  }
}
