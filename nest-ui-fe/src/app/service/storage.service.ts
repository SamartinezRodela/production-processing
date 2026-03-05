// src/app/service/storage.service.ts
import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '@config/app.constants';
import { AppSettings } from '@models/processing.types';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  // Métodos específicos
  getSettings(): AppSettings | null {
    return this.getItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS);
  }

  setSettings(settings: AppSettings): void {
    this.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
  }
}
