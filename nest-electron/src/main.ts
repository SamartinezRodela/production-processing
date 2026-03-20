import { app, BrowserWindow, ipcMain, Menu, shell, dialog } from "electron";
import * as path from "path";
import * as http from "http";
import * as fs from "fs";
import { exec } from "child_process";
import { findAvailablePort } from "./port-finder";

let mainWindow: BrowserWindow | null = null;
let BACKEND_PORT = 3000; // Ya no es constante, será dinámico
require("./api-client").ApiClient.setPort(BACKEND_PORT);
// Detectar si está empaquetado correctamente
const isDev = !app.isPackaged;

// ==========================================
// PROTECCIÓN CONTRA MÚLTIPLES INSTANCIAS
// ==========================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Si ya hay otra instancia corriendo, cerrar esta
  console.log("Another instance is already running. Exiting...");
  app.quit();
} else {
  // Si alguien intenta abrir otra instancia, enfocar la ventana existente
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    console.log("Second instance detected, focusing existing window");
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

console.log("=== ELECTRON STARTUP ===");
console.log("app.isPackaged:", app.isPackaged);
console.log("isDev:", isDev);
console.log("process.resourcesPath:", process.resourcesPath);
console.log("========================");

function createWindow(): void {
  console.log("=== createWindow() called ===");
  console.log("Current windows count:", BrowserWindow.getAllWindows().length);

  // Prevenir crear múltiples ventanas
  if (mainWindow !== null) {
    console.log("Window already exists, focusing it instead");
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: false, // Mostrar menú para acceder a logs
    title: "Production Processing",
  });

  // Crear menú con opción para ver logs
  const menu = Menu.buildFromTemplate([
    {
      label: "Ayuda",
      submenu: [
        {
          label: "Ver Logs del Backend",
          click: () => {
            const logPath = path.join(app.getPath("userData"), "backend.log");
            shell.openPath(logPath);
          },
        },
        {
          label: "Abrir Carpeta de Logs",
          click: () => {
            shell.openPath(app.getPath("userData"));
          },
        },
        {
          label: "DevTools",
          click: () => {
            mainWindow?.webContents.openDevTools();
          },
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  // En desarrollo: cargar desde servidor Angular
  // En producción: cargar desde archivos empaquetados
  if (isDev) {
    mainWindow.loadURL("http://localhost:4200");
    mainWindow.webContents.openDevTools();
  } else {
    const frontendPath = path.join(
      process.resourcesPath,
      "frontend",
      "index.html",
    );
    mainWindow.loadFile(frontendPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Iniciar backend NestJS con puerto dinámico
async function startBackend(): Promise<void> {
  console.log("=== STARTING BACKEND ===");
  console.log("isDev:", isDev);
  console.log("app.isPackaged:", app.isPackaged);

  if (isDev) {
    console.log(
      "Development mode: Backend should be running separately on port 3000",
    );
    BACKEND_PORT = 3000; // En desarrollo, asumir 3000
    return;
  }

  console.log("Production mode: Starting backend automatically");

  // Buscar puerto disponible
  const availablePort = await findAvailablePort(3000, 3010);

  if (!availablePort) {
    console.error("❌ No se pudo encontrar un puerto disponible");
    dialog.showErrorBox(
      "Error al iniciar",
      "No se pudo encontrar un puerto disponible para el backend. Por favor cierra otras aplicaciones e intenta de nuevo.",
    );
    app.quit();
    return;
  }

  BACKEND_PORT = availablePort;
  console.log(`✅ Usando puerto: ${BACKEND_PORT}`);

  // En producción, iniciar el backend empaquetado
  const backendPath = path.join(
    process.resourcesPath,
    "backend",
    "dist",
    "main.js",
  );
  const logPath = path.join(app.getPath("userData"), "backend.log");

  console.log("Starting backend from:", backendPath);
  console.log("Backend logs will be saved to:", logPath);

  const logStream = fs.createWriteStream(logPath, { flags: "a" });

  logStream.write(`\n\n=== Backend Start ${new Date().toISOString()} ===\n`);
  logStream.write(`Backend path: ${backendPath}\n`);
  logStream.write(`Backend port: ${BACKEND_PORT}\n`);

  // Usar el Node.js embebido de Electron en lugar de depender del Node.js del sistema
  const { spawn } = require("child_process");

  // process.execPath apunta al ejecutable de Electron, que incluye Node.js
  const nodePath = process.execPath;

  console.log("Using Node.js from:", nodePath);
  logStream.write(`Node.js path: ${nodePath}\n`);

  const backend = spawn(nodePath, [backendPath], {
    env: {
      ...process.env,
      PORT: BACKEND_PORT.toString(), // Usar puerto dinámico
      RESOURCES_PATH: process.resourcesPath,
      NODE_ENV: "production",
      ELECTRON_RUN_AS_NODE: "1", // CRÍTICO: Esto hace que Electron se ejecute como Node.js puro
    },
    cwd: path.join(process.resourcesPath, "backend"),
  });

  console.log("Backend spawn initiated");

  backend.stdout.on("data", (data: Buffer) => {
    const message = data.toString();
    console.log(`Backend: ${message}`);
    logStream.write(`[STDOUT] ${new Date().toISOString()} - ${message}\n`);
  });

  backend.stderr.on("data", (data: Buffer) => {
    const message = data.toString();
    console.error(`Backend Error: ${message}`);
    logStream.write(`[STDERR] ${new Date().toISOString()} - ${message}\n`);
  });

  backend.on("error", (error: any) => {
    console.error("Failed to start backend:", error);
    logStream.write(
      `[ERROR] ${new Date().toISOString()} - Failed to start: ${error.message}\n`,
    );
  });

  backend.on("close", (code: any) => {
    console.log(`Backend process exited with code ${code}`);
    logStream.write(
      `[CLOSE] ${new Date().toISOString()} - Process exited with code ${code}\n`,
    );
    logStream.end();
  });
}

// Esperar a que el backend esté listo
function waitForBackend(callback: () => void, maxAttempts = 30): void {
  let attempts = 0;

  const checkBackend = () => {
    attempts++;
    http
      .get(`http://localhost:${BACKEND_PORT}/`, (res) => {
        console.log("Backend is ready!");
        callback();
      })
      .on("error", () => {
        if (attempts < maxAttempts) {
          console.log(`Waiting for backend... (${attempts}/${maxAttempts})`);
          setTimeout(checkBackend, 1000);
        } else {
          console.error("Backend failed to start");
          callback(); // Continuar de todos modos
        }
      });
  };

  checkBackend();
}

app.whenReady().then(async () => {
  await startBackend();

  if (isDev) {
    // En desarrollo, crear ventana inmediatamente
    createWindow();
  } else {
    // En producción, esperar a que el backend esté listo
    waitForBackend(() => {
      createWindow();
    });
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ==========================================
// IPC HANDLERS BÁSICOS
// ==========================================

ipcMain.handle("get-backend-port", () => {
  console.log(`[IPC] get-backend-port: ${BACKEND_PORT}`);
  return BACKEND_PORT;
});

ipcMain.handle("get-app-path", () => {
  return app.getPath("userData");
});

ipcMain.handle("get-version", () => {
  return app.getVersion();
});

// ==========================================
// HANDLER PARA GUARDAR ARCHIVOS JSON
// ==========================================

ipcMain.handle(
  "save-json-file",
  async (_event, filePath: string, data: any) => {
    try {
      const fs = require("fs");
      const pathModule = require("path");
      //Crear la carpeta si no existe
      const dir = pathModule.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      return { succeess: true };
    } catch (error: any) {
      console.error("[IPC] Error saving JSON:", error);
      return { success: false, error: error.message };
    }
  },
);

// ==========================================
// AGREGA TUS IPC HANDLERS PYTHON AQUÍ ⬇
// ==========================================

// Ejemplo:
// ipcMain.handle("python:tu-funcion", async (_event, param1: string, param2: number) => {
//   const { ApiClient } = require("./api-client");
//   return ApiClient.pythonTuFuncion(param1, param2);
// });

ipcMain.handle(
  "python:saludar",
  async (_event, nombre: string, token?: string) => {
    try {
      console.log("[IPC] python:saludar llamado con:", nombre);
      const { ApiClient } = require("./api-client");
      const result = await ApiClient.pythonSaludar(nombre, token);
      console.log("[IPC] python:saludar resultado:", result);
      return result;
    } catch (error: any) {
      console.error("[IPC] Error en python:saludar:", error);
      throw new Error(
        `Error en saludar: ${error.message || JSON.stringify(error)}`,
      );
    }
  },
);

ipcMain.handle(
  "shell:show-item-in-folder",
  async (_event, filePath: string) => {
    try {
      console.log("📂 [IPC] show-item-in-folder llamado:", filePath);

      // Verificar que el archivo existe
      const fs = require("fs");
      if (!fs.existsSync(filePath)) {
        console.error("❌ [IPC] Archivo no existe:", filePath);
        return { success: false, error: "File does not exist" };
      }

      // Abrir la carpeta que contiene el archivo y seleccionarlo
      shell.showItemInFolder(filePath);

      console.log("✅ [IPC] Carpeta abierta exitosamente");
      return { success: true };
    } catch (error: any) {
      console.error("❌ [IPC] Error en show-item-in-folder:", error);
      return { success: false, error: error.message };
    }
  },
);

// Registrar el handler
ipcMain.handle("python:procesarPDF", async (event, datos) => {
  try {
    console.log("[IPC] python:procesarPDF llamado con:", datos);

    // Construir la ruta del ejecutable
    const isMac = process.platform === "darwin";
    const exeName = isMac ? "procesar_pdf" : "procesar_pdf.exe";
    let exePath: string;

    if (isDev) {
      // En desarrollo: buscar en nest-files-py-embedded/executables/
      exePath = path.join(
        __dirname,
        "../../nest-files-py-embedded/executables",
        exeName,
      );
      // Fallback a .py si no existe el .exe en desarrollo
      if (!fs.existsSync(exePath)) {
        const scriptPath = path.join(
          __dirname,
          "../../nest-files-py/procesar_pdf.py",
        );
        const pythonExe = isMac
          ? path.join(
              __dirname,
              "../../nest-files-py-embedded-mac/python-runtime/bin/python3",
            )
          : path.join(__dirname, "../../nest-files-py-embedded/python.exe");

        console.log("[IPC] EXE no encontrado, fallback a .py:", scriptPath);
        const datosJson = JSON.stringify(datos);

        return new Promise((resolve) => {
          exec(
            `"${pythonExe}" "${scriptPath}" "${datosJson.replace(/"/g, '\\"')}"`,
            { maxBuffer: 1024 * 1024 * 10 },
            (error, stdout, stderr) => {
              if (error) {
                resolve({ success: false, error: error.message });
                return;
              }
              try {
                resolve(JSON.parse(stdout));
              } catch (e: any) {
                resolve({
                  success: false,
                  error: "Invalid JSON response",
                  raw: stdout,
                });
              }
            },
          );
        });
      }
    } else {
      // En producción: usar ruta desde resources/python/executables/
      exePath = path.join(
        process.resourcesPath,
        "python",
        "executables",
        exeName,
      );
    }

    console.log("[IPC] Ejecutable path:", exePath);

    if (!fs.existsSync(exePath)) {
      console.error("[IPC] Ejecutable no encontrado:", exePath);
      return { success: false, error: `Executable not found: ${exePath}` };
    }

    const datosJson = JSON.stringify(datos);

    return new Promise((resolve) => {
      exec(
        `"${exePath}" "${datosJson.replace(/"/g, '\\"')}"`,
        { maxBuffer: 1024 * 1024 * 10 },
        (error, stdout, stderr) => {
          if (error) {
            console.error("[IPC] Error ejecutando:", error.message);
            resolve({ success: false, error: error.message });
            return;
          }

          if (stderr) {
            console.warn("[IPC] stderr:", stderr);
          }

          try {
            const result = JSON.parse(stdout);
            console.log("[IPC] Resultado:", result);
            resolve(result);
          } catch (e: any) {
            console.error("[IPC] Error parseando JSON:", e.message);
            resolve({
              success: false,
              error: "Invalid JSON response",
              raw: stdout,
            });
          }
        },
      );
    });
  } catch (error: any) {
    console.error("[IPC] Error en python:procesarPDF:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("dialog:select-folder", async () => {
  try {
    const isMac = process.platform === "darwin";

    const dialogOptions: any = {
      properties: ["openDirectory"],
      title: "Select Base Path Folder",
    };

    // En Mac, agregar opciones adicionales para permisos
    if (isMac) {
      dialogOptions.properties.push("createDirectory");
      dialogOptions.message = "Select a folder to access files";
      dialogOptions.buttonLabel = "Select Folder";
    }

    const result = await dialog.showOpenDialog(mainWindow!, dialogOptions);

    if (result.canceled) {
      return { canceled: true, path: null };
    }

    const selectedPath = result.filePaths[0];

    // En Mac, verificar que tenemos acceso
    if (isMac) {
      try {
        const fs = require("fs");
        // Intentar leer la carpeta para verificar permisos
        fs.readdirSync(selectedPath);
        console.log(`[Mac] Acceso verificado a: ${selectedPath}`);
      } catch (error: any) {
        console.error(`[Mac] Sin acceso a: ${selectedPath}`, error);
        throw new Error(`No access to selected folder: ${error.message}`);
      }
    }

    return { canceled: false, path: selectedPath };
  } catch (error: any) {
    console.error("[IPC] Error en dialog:select-folder:", error);
    throw new Error(`Error selecting folder: ${error.message}`);
  }
});

ipcMain.handle(
  "python:generar-pdf",
  async (
    _event,
    datos: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
    },
    token?: string,
  ) => {
    try {
      console.log("[IPC] python:generar-pdf llamado con:", datos);
      const { ApiClient } = require("./api-client");
      const result = await ApiClient.pythonGenerarPDF(datos, token);
      console.log("[IPC] python:generar-pdf resultado:", result);
      return result;
    } catch (error: any) {
      console.error("[IPC] Error en python:generar-pdf:", error);
      throw new Error(
        `Error en generar-pdf: ${error.message || JSON.stringify(error)}`,
      );
    }
  },
);

ipcMain.handle(
  "python:guardar-pdf-relativo",
  async (
    _event,
    datos: {
      output_path: string;
      relative_path: string;
      input_path: string;
    },
    token?: string,
  ) => {
    try {
      console.log("IPC python:guardar-pdf-relativo");
      const { ApiClient } = require("./api-client");
      return await ApiClient.pythonGuardarPdfRelativo(datos, token);
    } catch (error: any) {
      console.error("[IPC] Error en python:guardar-pdf-relativo:", error);

      // Extraer el error real del backend si viene en formato JSON
      const backendError = error.data
        ? JSON.stringify(error.data)
        : error.message || JSON.stringify(error);
      throw new Error(`Fallo en el Backend: ${backendError}`);
    }
  },
);

ipcMain.handle(
  "python:generar-path-pdf",
  async (
    _event,
    datos: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
      ruta_salida: string;
    },
    token?: string,
  ) => {
    try {
      console.log("[IPC] python:generar-pdf llamado con:", datos);
      const { ApiClient } = require("./api-client");
      const result = await ApiClient.pythonGenerarPathPDF(datos, token);
      console.log("[IPC] python:generar-pdf resultado:", result);

      return result;
    } catch (error: any) {
      console.error("[IPC] Error en python:generar-pdf:", error);
      throw new Error(
        `Error en generar-pdf: ${error.message || JSON.stringify(error)}`,
      );
    }
  },
);

ipcMain.handle("read-folder", async (_event, folderPath: string) => {
  try {
    const fs = require("fs");
    const pathModule = require("path");

    if (!fs.existsSync(folderPath)) {
      return { success: false, error: "Folder does not exist", items: [] };
    }

    const items = fs.readdirSync(folderPath);
    const folderItems = items.map((item: string) => {
      const itemPath = pathModule.join(folderPath, item);
      const stats = fs.statSync(itemPath);

      return {
        name: item,
        path: itemPath,
        type: stats.isDirectory() ? "folder" : "file",
        size: stats.isFile() ? stats.size : undefined,
        extension: stats.isFile() ? pathModule.extname(item) : undefined,
      };
    });

    return { success: true, items: folderItems };
  } catch (error: any) {
    console.error("[IPC] Error reading folder:", error);
    return { success: false, error: error.message, items: [] };
  }
});

ipcMain.handle("get-parent-path", async (_event, folderPath: string) => {
  try {
    const pathModule = require("path");
    const parentPath = pathModule.dirname(folderPath);

    return {
      success: true,
      parentPath: parentPath,
      canNavigateUp: parentPath !== folderPath,
    };
  } catch (error: any) {
    console.error("[IPC] Error getting parent path:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("read-folder-recursive", async (_event, folderPath: string) => {
  try {
    const fs = require("fs");
    const pathModule = require("path");

    if (!fs.existsSync(folderPath)) {
      return { success: false, error: "Folder does not exist", files: [] };
    }

    const files: any[] = [];
    function readDirRecursive(dirPath: string) {
      const items = fs.readdirSync(dirPath);
      items.forEach((item: string) => {
        const itemPath = pathModule.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isFile()) {
          files.push({
            name: item,
            path: itemPath,
            size: stats.size,
            extension: pathModule.extname(item),
          });
        } else if (stats.isDirectory) {
          readDirRecursive(itemPath);
        }
      });
    }

    readDirRecursive(folderPath);
    return { success: true, files: files };
  } catch (error: any) {
    console.error("[IPC] Error reading folder recursively:", error);
    return { success: false, error: error.message, files: [] };
  }
});
