import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiUrlService {
  private apiUrl: string | null = null;

  constructor() {}

  /**
   * Obtiene la URL del API dinámicamente
   * En Electron: obtiene el puerto del proceso principal
   * Cachea el resultado para no hacer múltiples llamadas IPC
   */
  async getApiUrl(): Promise<string> {
    // Si ya tenemos la URL cacheada, retornarla
    if (this.apiUrl) {
      return this.apiUrl;
    }

    // Verificar si estamos en Electron
    if (window.electronAPI && window.electronAPI.getBackendPort) {
      try {
        const port = await window.electronAPI.getBackendPort();
        this.apiUrl = `http://localhost:${port}`;
        console.log(` API URL configurada: ${this.apiUrl}`);
        return this.apiUrl;
      } catch (error) {
        console.error('Error obteniendo puerto del backend:', error);
        // Fallback a puerto por defecto
        this.apiUrl = 'http://localhost:3000';
        return this.apiUrl;
      }
    }

    // Fallback si no estamos en Electron (no debería pasar)
    this.apiUrl = 'http://localhost:3000';
    return this.apiUrl;
  }

  /**
   * Resetea la URL cacheada (útil para testing o reconexión)
   */
  resetCache(): void {
    this.apiUrl = null;
  }
}
