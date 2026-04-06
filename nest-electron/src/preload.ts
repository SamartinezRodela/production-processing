import { contextBridge, ipcRenderer } from "electron";

// Expone APIs seguras al renderer process (Angular)
contextBridge.exposeInMainWorld("electronAPI", {
  // Métodos de sistema (fuera de python)
  getBackendPort: () => ipcRenderer.invoke("get-backend-port"),
  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
  selectFolders: () => ipcRenderer.invoke("dialog:select-folders"),
  showItemInFolder: (filePath: string) =>
    ipcRenderer.invoke("shell:show-item-in-folder", filePath),
  getParentPath: (folderPath: string) =>
    ipcRenderer.invoke("get-parent-path", folderPath),
  readFolderRecursive: (folderPath: string) =>
    ipcRenderer.invoke("read-folder-recursive", folderPath),
  readFolder: (folderPath: string) =>
    ipcRenderer.invoke("read-folder", folderPath),
  saveJsonFile: (filePath: string, data: any) =>
    ipcRenderer.invoke("save-json-file", filePath, data),

  // APIs de Python
  python: {
    // ==========================================
    // AGREGA TUS MÉTODOS PYTHON AQUÍ
    // ==========================================
    // Ejemplo:
    // tuFuncion: (param1: string, param2: number) =>
    //   ipcRenderer.invoke("python:tu-funcion", param1, param2),

    saludar: (nombre: string, token?: string) =>
      ipcRenderer.invoke("python:saludar", nombre, token),
    generarPDF: (
      datos: {
        titulo: string;
        contenido: string;
        autor: string;
        nombre_archivo: string;
      },
      token?: string,
    ) => ipcRenderer.invoke("python:generar-pdf", datos, token),

    generarPathPDF: (
      datos: {
        titulo: string;
        contenido: string;
        autor: string;
        nombre_archivo: string;
        ruta_salida: string;
      },
      token?: string,
    ) => ipcRenderer.invoke("python:generar-path-pdf", datos, token),

    procesarPDF: (datos: {
      input_path: string;
      file_name: string;
      output_path: string;
      base_path: string;
      style?: string;
      size?: string;
    }) => ipcRenderer.invoke("python:procesarPDF", datos),

    guardarPdfRelativo: (
      datos: {
        output_path: string;
        relative_path: string;
        input_path: string;
      },
      token?: string,
    ) => ipcRenderer.invoke("python:guardar-pdf-relativo", datos, token),
    // Ejemplo: enviar mensajes al proceso principal
    sendMessage: (channel: string, data: any) => {
      ipcRenderer.send(channel, data);
    },
  },

  // Ejemplo: recibir mensajes del proceso principal
  onMessage: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
});
