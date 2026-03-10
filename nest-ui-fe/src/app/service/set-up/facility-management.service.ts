import { Injectable, signal, computed } from '@angular/core';
import { DEFAULT_FACILITIES, Facility } from '@pages/constants/facilities.constants';
import { FacilitiesApiService } from '@services/facilities-api.service';
import { WebSocketService } from '@services/websocket.service';

@Injectable({
  providedIn: 'root',
})
export class FacilityManagementService {
  facilities = signal<Facility[]>(DEFAULT_FACILITIES);
  selectedFacility = signal<string>('1');

  facilityOptions = computed(() =>
    this.facilities().map((facility) => ({
      value: facility.id,
      label: facility.name,
    })),
  );

  constructor(
    private facilitiesApi: FacilitiesApiService,
    private websocketService: WebSocketService,
  ) {
    this.loadFacilities();
    this.setupWebSocket();
  }

  /**
   * Configura WebSocket para escuchar cambios en la base de datos
   */
  private async setupWebSocket(): Promise<void> {
    await this.websocketService.connect();

    this.websocketService.onDatabaseChanged().subscribe(() => {
      console.log('Reloading facilities due to database change');
      this.loadFacilities();
    });
  }

  async loadFacilities(): Promise<void> {
    const facilities = await this.facilitiesApi.getAll();
    this.facilities.set(facilities);
  }

  async reloadFacilities(): Promise<void> {
    const facilities = await this.facilitiesApi.reload();
    this.facilities.set(facilities);
  }

  async addFacility(name: string): Promise<boolean> {
    const newFacility = await this.facilitiesApi.create(name);

    if (newFacility) {
      this.facilities.set([...this.facilities(), newFacility]);
      return true;
    }

    return false;
  }

  async updateFacility(id: string, name: string): Promise<boolean> {
    const updated = await this.facilitiesApi.update(id, name);

    if (updated) {
      this.facilities.set(this.facilities().map((f) => (f.id === id ? updated : f)));
      return true;
    }

    return false;
  }

  async removeFacility(id: string): Promise<boolean> {
    const deleted = await this.facilitiesApi.delete(id);

    if (deleted) {
      this.facilities.set(this.facilities().filter((f) => f.id !== id));

      // Si el facility seleccionado fue eliminado, seleccionar el primero
      if (this.selectedFacility() === id && this.facilities().length > 0) {
        this.selectedFacility.set(this.facilities()[0].id);
      }

      return true;
    }

    return false;
  }
  getFacilityById(id: string): Facility | undefined {
    return this.facilities().find((f) => f.id === id);
  }

  setSelectedFacility(facilityId: string): void {
    this.selectedFacility.set(facilityId);
  }
}
