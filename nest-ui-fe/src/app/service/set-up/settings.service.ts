// nest-ui-fe/src/app/service/settings.service.ts
import { Injectable, signal } from '@angular/core';
import { Facility } from '@pages/constants/facilities.constants';
import { environment } from '@environments/environment';

export interface AppSettings {
  basePath: string;
  os: 'windows' | 'macos';
  selectedFacility: string;
  facilities: Facility[];
  autoSave: boolean;
  notifications: boolean;
  theme?: 'light' | 'dark';
  // Agregar más configuraciones según necesites
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly SETTINGS_KEY = 'appSettings';

  //Settings signals
  operatingSystem = signal<'windows' | 'macos'>('windows');
  basePath = signal(environment.paths.windows);
  autoSave = signal(false);
  notifications = signal(true);

  getSettings(): AppSettings | null {
    const settingsStr = localStorage.getItem(this.SETTINGS_KEY);
    if (settingsStr) {
      try {
        return JSON.parse(settingsStr);
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }
    return null;
  }

  getBasePath(): string {
    const settings = this.getSettings();
    return settings?.basePath || '';
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }
  loadSettings(): AppSettings | null {
    const settings = this.getSettings();
    if (settings) {
      this.operatingSystem.set(settings.os);
      this.basePath.set(settings.basePath);
      this.autoSave.set(settings.autoSave);
      this.notifications.set(settings.notifications);
    }
    return settings;
  }

  setOperatingSystem(os: 'windows' | 'macos'): void {
    this.operatingSystem.set(os);

    if (os === 'macos') {
      this.basePath.set(environment.paths.macos);
    } else {
      this.basePath.set(environment.paths.windows);
    }
  }

  setBasePath(path: string): void {
    this.basePath.set(path);
  }

  resetToDefault(): void {
    this.operatingSystem.set('windows');
    this.basePath.set(environment.paths.windows);
    this.autoSave.set(false);
    this.notifications.set(true);
  }

  clearSettings(): void {
    localStorage.removeItem(this.SETTINGS_KEY);
  }
}
