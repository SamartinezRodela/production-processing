// nest-ui-fe/src/app/service/settings.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Facility } from '@pages/constants/facilities.constants';
import { environment } from '@environments/environment';
import { ApiUrlService } from '@services/api-url.service';

export interface AppSettings {
  basePath: string;
  outputPath: string;
  os: 'windows' | 'macos';
  selectedFacility: string;
  facilities: Facility[];
  autoSave: boolean;
  notifications: boolean;
  theme?: 'light' | 'dark';
}

export interface BackendSettings {
  selectedFacilityId: string;
  basePath: string;
  outputPath: string;
  os: 'windows' | 'macos';
  theme: 'light' | 'dark';
  autoSave: boolean;
  notifications: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  //Settings signals
  operatingSystem = signal<'windows' | 'macos'>('windows');
  basePath = signal(environment.paths.windows);
  outputPath = signal('C:\\Output');
  autoSave = signal(false);
  notifications = signal(true);

  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService,
  ) {}

  /**
   * Carga settings desde el backend (fuente principal)
   */
  async loadSettingsFromBackend(): Promise<BackendSettings | null> {
    try {
      const apiUrl = await this.apiUrlService.getApiUrl();
      const settings = await firstValueFrom(this.http.get<BackendSettings>(`${apiUrl}/settings`));

      // Actualizar signals con los valores del backend
      this.operatingSystem.set(settings.os);
      this.basePath.set(settings.basePath);
      this.outputPath.set(settings.outputPath);
      this.autoSave.set(settings.autoSave);
      this.notifications.set(settings.notifications);

      // console.log('Settings loaded from backend:', settings);
      return settings;
    } catch (error) {
      console.error('Error loading settings from backend:', error);
      return null;
    }
  }

  getBasePath(): string {
    return this.basePath();
  }

  getOutputPath(): string {
    return this.outputPath();
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    // NO guardar en localStorage (DEPRECATED)
    // localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));

    // Sincronizar con backend (fuente principal)
    try {
      const apiUrl = await this.apiUrlService.getApiUrl();
      await firstValueFrom(
        this.http.put(`${apiUrl}/settings`, {
          basePath: settings.basePath,
          outputPath: settings.outputPath,
          os: settings.os,
          selectedFacilityId: settings.selectedFacility,
        }),
      );
      //console.log('✅ Settings synchronized with backend');
    } catch (error) {
      console.error('❌ Error synchronizing settings with backend:', error);
    }
  }

  setOperatingSystem(os: 'windows' | 'macos'): void {
    this.operatingSystem.set(os);

    if (os === 'macos') {
      this.basePath.set(environment.paths.macos);
      this.outputPath.set(environment.paths.macos);
    } else {
      this.basePath.set(environment.paths.windows);
      this.outputPath.set(environment.paths.windows);
    }
  }

  setBasePath(path: string): void {
    this.basePath.set(path);
  }

  setOutputPath(path: string): void {
    this.outputPath.set(path);
  }

  resetToDefault(): void {
    this.operatingSystem.set('windows');
    this.basePath.set(environment.paths.windows);
    this.outputPath.set('C:\\Output');
    this.autoSave.set(false);
    this.notifications.set(true);
  }
}
