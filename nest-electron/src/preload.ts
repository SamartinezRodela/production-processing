import { contextBridge, ipcRenderer } from "electron";

// Expone APIs seguras al renderer process (Angular)
contextBridge.exposeInMainWorld("electronAPI", {
  // Métodos de sistema (fuera de python)
  getBackendPort: () => ipcRenderer.invoke("get-backend-port"),
  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
  getParentPath: (folderPath: string) =>
    ipcRenderer.invoke("get-parent-path", folderPath),
  readFolderRecursive: (folderPath: string) =>
    ipcRenderer.invoke("read-folder-recursive", folderPath),
  readFolder: (folderPath: string) =>
    ipcRenderer.invoke("read-folder", folderPath),

  // APIs de Python
  python: {
    // ==========================================
    // AGREGA TUS MÉTODOS PYTHON AQUÍ ⬇️
    // ==========================================
    // Ejemplo:
    // tuFuncion: (param1: string, param2: number) =>
    //   ipcRenderer.invoke("python:tu-funcion", param1, param2),

    saludar: (nombre: string) => ipcRenderer.invoke("python:saludar", nombre),
    generarPDF: (datos: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
    }) => ipcRenderer.invoke("python:generar-pdf", datos),

    generarPathPDF: (datos: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
      ruta_salida: string;
    }) => ipcRenderer.invoke("python:generar-path-pdf", datos),
  },

  // Ejemplo: enviar mensajes al proceso principal
  sendMessage: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },

  // Ejemplo: recibir mensajes del proceso principal
  onMessage: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
});
