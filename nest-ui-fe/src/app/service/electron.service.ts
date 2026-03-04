import { Injectable } from '@angular/core';

declare global {
  interface Window {
    electronAPI?: {
      // Métodos de sistema (fuera de python)
      getBackendPort: () => Promise<number>;
      selectFolder: () => Promise<{ canceled: boolean; path: string | null }>;
      readFolder: (folderPath: string) => Promise<any>;
      readFolderRecursive: (folderPath: string) => Promise<any>;
      sendMessage: (channel: string, data: any) => void;
      onMessage: (channel: string, callback: Function) => void;
      getParentPath: (folderPath: string) => Promise<any>;

      python: {
        // ==========================================
        // AGREGA TUS MÉTODOS PYTHON AQUÍ ⬇
        // ==========================================
        // Ejemplo:
        // tuFuncion: (param1: string, param2: number) => Promise<any>;

        saludar: (nombre: string) => Promise<any>;
        generarPDF: (datos: {
          titulo: string;
          contenido: string;
          autor: string;
          nombre_archivo: string;
        }) => Promise<any>;

        generarPathPDF: (datos: {
          titulo: string;
          contenido: string;
          autor: string;
          nombre_archivo: string;
          ruta_salida: string;
        }) => Promise<any>;
      };
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  isElectron = !!window.electronAPI;

  // ==========================================
  // AGREGA TUS MÉTODOS PYTHON AQUÍ
  // ==========================================

  // Ejemplo:
  // async pythonTuFuncion(param1: string, param2: number): Promise<any> {
  //   console.log(' ElectronService.pythonTuFuncion llamado:', { param1, param2 });
  //   if (!this.isElectron) {
  //     throw new Error('No está corriendo en Electron');
  //   }
  //   console.log(' Llamando a window.electronAPI.python.tuFuncion...');
  //   const result = await window.electronAPI!.python.tuFuncion(param1, param2);
  //   console.log('Resultado:', result);
  //   return result;
  // }

  async selectFolder(): Promise<{ canceled: boolean; path: string | null }> {
    if (!this.isElectron) {
      console.warn('selectFolder solo funciona en Electron');
      return { canceled: true, path: null };
    }

    try {
      const result = await window.electronAPI!.selectFolder();
      return result;
    } catch (error) {
      console.error('Error al seleccionar carpeta:', error);
      throw error;
    }
  }

  async pythonSaludar(nombre: string): Promise<any> {
    console.log('ElectronService.pythonSaludar llamado:', { nombre });

    if (!this.isElectron) {
      throw new Error('No está corriendo en Electron');
    }

    try {
      console.log('Llamando a window.electronAPI.python.saludar...');
      const result = await window.electronAPI!.python.saludar(nombre);
      console.log('Resultado:', result);
      return result;
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async pythonGenerarPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }): Promise<any> {
    console.log('ElectronService.pythonGenerarPDF llamado:', { datos });

    if (!this.isElectron) {
      throw new Error('No está corriendo en Electron');
    }

    try {
      console.log('Llamando a window.electronAPI.python.generarPDF...');
      const result = await window.electronAPI!.python.generarPDF(datos);
      console.log('Resultado:', result);
      return result;
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async pythonGenerarPathPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
    ruta_salida: string;
  }): Promise<any> {
    console.log('ElectronService.generarPathPDF llamado:', { datos });

    if (!this.isElectron) {
      throw new Error('No está corriendo en Electron');
    }

    try {
      console.log('Llamando a window.electronAPI.python.generarPathPDF...');
      const result = await window.electronAPI!.python.generarPathPDF(datos);
      console.log('Resultado:', result);
      return result;
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async readFolder(folderPath: string): Promise<any> {
    console.log('ElectronService.readFolder llamado:', { folderPath });

    if (!this.isElectron) {
      console.warn('readFolder solo funciona en Electron');
      return { success: false, error: 'Not running in Electron', items: [] };
    }

    // Verificar que readFolder existe
    if (!window.electronAPI?.readFolder) {
      console.error('window.electronAPI.readFolder no está definido');
      return { success: false, error: 'readFolder API not available', items: [] };
    }

    try {
      console.log('Llamando a window.electronAPI.readFolder...');
      const result = await window.electronAPI.readFolder(folderPath);
      console.log('Resultado:', result);
      return result;
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return { success: false, error: error.message, items: [] };
    }
  }

  async getParentPath(folderPath: string): Promise<any> {
    console.log('ElectronService.getParentPath llamado:', { folderPath });

    if (!this.isElectron) {
      console.warn('getParentPath solo funciona en Electron');
      return { success: false, error: 'Not running in Electron' };
    }

    if (!window.electronAPI?.getParentPath) {
      console.error('window.electronAPI.getParentPath no está definido');
      return { success: false, error: 'getParentPath API not available' };
    }

    try {
      console.log('Llamando a window.electronAPI.getParentPath...');
      const result = await window.electronAPI.getParentPath(folderPath);
      console.log('Resultado:', result);
      return result;
    } catch (error: any) {
      console.error('Error completo:', error);
      return { success: false, error: error.message };
    }
  }

  async readFolderRecursive(folderPath: string): Promise<any> {
    if (!this.isElectron) {
      return { success: false, error: 'Not Running in Electron', files: [] };
    }

    try {
      const result = await window.electronAPI!.readFolderRecursive(folderPath);
      return result;
    } catch (error: any) {
      console.error('Error reading folder recursively', error);
      return { success: false, error: error.message, files: [] };
    }
  }

  // Métodos genéricos
  sendMessage(channel: string, data: any): void {
    if (this.isElectron) {
      window.electronAPI!.sendMessage(channel, data);
    }
  }

  onMessage(channel: string, callback: Function): void {
    if (this.isElectron) {
      window.electronAPI!.onMessage(channel, callback);
    }
  }
}
