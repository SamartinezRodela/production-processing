# Guía: Puerto Dinámico para Evitar Conflictos

Esta guía te muestra cómo implementar selección dinámica de puerto en tu aplicación Electron para evitar conflictos cuando el puerto 3000 ya está en uso.

---

## 🎯 Problema

Si otra aplicación ya está usando el puerto 3000, tu app no puede iniciar el backend y falla.

**Solución:** Intentar múltiples puertos (3000, 3001, 3002, etc.) hasta encontrar uno disponible, y comunicar ese puerto al frontend.

---

## 📋 Arquitectura de la Solución

```
┌─────────────────────────────────────────────────────────┐
│ ELECTRON MAIN PROCESS                                   │
│                                                         │
│ 1. Busca puerto disponible (3000-3010)                 │
│ 2. Inicia backend NestJS en ese puerto                 │
│ 3. Guarda puerto en archivo temporal                   │
│ 4. Expone puerto via IPC a renderer                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ ANGULAR FRONTEND (Renderer Process)                    │
│                                                         │
│ 1. Solicita puerto via IPC                             │
│ 2. Construye API_URL dinámicamente                     │
│ 3. Usa ese URL para todas las peticiones HTTP          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Paso 1: Crear Utilidad para Encontrar Puerto Disponible

### 1.1 Crear archivo de utilidades

**Archivo:** `nest-electron/src/port-finder.ts`

```typescript
import * as net from "net";

/**
 * Encuentra un puerto disponible en el rango especificado
 * @param startPort Puerto inicial (default: 3000)
 * @param endPort Puerto final (default: 3010)
 * @returns Promise con el puerto disponible o null si no hay ninguno
 */
export async function findAvailablePort(
  startPort: number = 3000,
  endPort: number = 3010,
): Promise<number | null> {
  for (let port = startPort; port <= endPort; port++) {
    const isAvailable = await isPortAvailable(port);
    if (isAvailable) {
      console.log(`✅ Puerto ${port} está disponible`);
      return port;
    } else {
      console.log(`❌ Puerto ${port} está ocupado, intentando siguiente...`);
    }
  }

  console.error(
    `❌ No se encontró ningún puerto disponible entre ${startPort} y ${endPort}`,
  );
  return null;
}

/**
 * Verifica si un puerto específico está disponible
 * @param port Puerto a verificar
 * @returns Promise<boolean> true si está disponible
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        resolve(false); // Puerto ocupado
      } else {
        resolve(false); // Otro error, asumir no disponible
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true); // Puerto disponible
    });

    server.listen(port, "127.0.0.1");
  });
}
```

---

## 🚀 Paso 2: Actualizar Backend para Usar Puerto Dinámico

### 2.1 Modificar nest-ui-be/src/main.ts

**Archivo:** `nest-ui-be/src/main.ts`

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para que Electron pueda hacer peticiones
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  // ✅ CAMBIO: Usar puerto desde variable de entorno o 3000 por defecto
  const port = parseInt(process.env.PORT || "3000", 10);

  await app.listen(port);
  console.log(`🚀 Backend corriendo en: http://localhost:${port}`);
}
bootstrap();
```

**Nota:** Este cambio ya está implementado en tu código actual, solo verifica que esté así.

---

## ⚡ Paso 3: Actualizar Electron Main Process

### 3.1 Modificar nest-electron/src/main.ts

Reemplaza la sección de `startBackend()` y agrega nuevas funciones:

```typescript
import { app, BrowserWindow, ipcMain, Menu, shell, dialog } from "electron";
import * as path from "path";
import * as http from "http";
import * as fs from "fs";
import { findAvailablePort } from "./port-finder";

let mainWindow: BrowserWindow | null = null;
let BACKEND_PORT = 3000; // ✅ CAMBIO: Ya no es constante, será dinámico

// Detectar si está empaquetado correctamente
const isDev = !app.isPackaged;

console.log("=== ELECTRON STARTUP ===");
console.log("app.isPackaged:", app.isPackaged);
console.log("isDev:", isDev);
console.log("process.resourcesPath:", process.resourcesPath);
console.log("========================");

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: false,
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

// ✅ NUEVO: Iniciar backend con puerto dinámico
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

  // ✅ NUEVO: Buscar puerto disponible
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
  logStream.write(`Backend port: ${BACKEND_PORT}\n`); // ✅ NUEVO: Log del puerto

  // Aquí puedes usar child_process para iniciar el backend
  const { spawn } = require("child_process");
  const backend = spawn("node", [backendPath], {
    env: {
      ...process.env,
      PORT: BACKEND_PORT.toString(), // ✅ CAMBIO: Usar puerto dinámico
      RESOURCES_PATH: process.resourcesPath,
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

// ✅ CAMBIO: Usar BACKEND_PORT dinámico
function waitForBackend(callback: () => void, maxAttempts = 30): void {
  let attempts = 0;

  const checkBackend = () => {
    attempts++;
    http
      .get(`http://localhost:${BACKEND_PORT}/`, (res) => {
        console.log(`✅ Backend is ready on port ${BACKEND_PORT}!`);
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

// ✅ CAMBIO: startBackend ahora es async
app.whenReady().then(async () => {
  await startBackend(); // ✅ CAMBIO: Esperar a que se encuentre el puerto

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
// IPC HANDLERS
// ==========================================

// ✅ NUEVO: Handler para obtener el puerto del backend
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

// ... resto de tus IPC handlers ...
```

---

## 🎨 Paso 4: Actualizar Preload Script

### 4.1 Modificar nest-electron/src/preload.ts

Agrega el nuevo handler para obtener el puerto:

```typescript
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // ✅ NUEVO: Obtener puerto del backend
  getBackendPort: () => ipcRenderer.invoke("get-backend-port"),

  // Existentes
  getAppPath: () => ipcRenderer.invoke("get-app-path"),
  getVersion: () => ipcRenderer.invoke("get-version"),
  pythonSaludar: (nombre: string) =>
    ipcRenderer.invoke("python:saludar", nombre),
  pythonGenerarPDF: (datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }) => ipcRenderer.invoke("python:generar-pdf", datos),
  pythonGenerarPathPDF: (datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
    ruta_salida: string;
  }) => ipcRenderer.invoke("python:generar-path-pdf", datos),
  selectFolder: () => ipcRenderer.invoke("dialog:select-folder"),
  readFolder: (folderPath: string) =>
    ipcRenderer.invoke("read-folder", folderPath),
  getParentPath: (folderPath: string) =>
    ipcRenderer.invoke("get-parent-path", folderPath),
  readFolderRecursive: (folderPath: string) =>
    ipcRenderer.invoke("read-folder-recursive", folderPath),
});
```

---

## 🌐 Paso 5: Actualizar Frontend para Usar Puerto Dinámico

### 5.1 Actualizar tipos de Electron API

**Archivo:** `nest-ui-fe/src/app/types/electron.d.ts`

```typescript
export interface ElectronAPI {
  getBackendPort: () => Promise<number>; // ✅ NUEVO
  getAppPath: () => Promise<string>;
  getVersion: () => Promise<string>;
  pythonSaludar: (nombre: string) => Promise<any>;
  pythonGenerarPDF: (datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }) => Promise<any>;
  pythonGenerarPathPDF: (datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
    ruta_salida: string;
  }) => Promise<any>;
  selectFolder: () => Promise<{ canceled: boolean; path: string | null }>;
  readFolder: (folderPath: string) => Promise<any>;
  getParentPath: (folderPath: string) => Promise<any>;
  readFolderRecursive: (folderPath: string) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

### 5.2 Crear servicio para obtener API URL

**Archivo:** `nest-ui-fe/src/app/service/api-url.service.ts`

```typescript
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
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
        console.log(`✅ API URL configurada: ${this.apiUrl}`);
        return this.apiUrl;
      } catch (error) {
        console.error("Error obteniendo puerto del backend:", error);
        // Fallback a puerto por defecto
        this.apiUrl = "http://localhost:3000";
        return this.apiUrl;
      }
    }

    // Fallback si no estamos en Electron (no debería pasar)
    this.apiUrl = "http://localhost:3000";
    return this.apiUrl;
  }

  /**
   * Resetea la URL cacheada (útil para testing o reconexión)
   */
  resetCache(): void {
    this.apiUrl = null;
  }
}
```

### 5.3 Actualizar app.constants.ts

**Archivo:** `nest-ui-fe/src/app/config/app.constants.ts`

```typescript
import { environment } from "../../environments/environment";

export const APP_CONFIG = {
  // ✅ CAMBIO: Ya no hardcodeamos el puerto, se obtiene dinámicamente
  // API_URL se construirá en tiempo de ejecución via ApiUrlService
  PROGRESS_INTERVAL: environment.app.progressInterval,
  VALID_FILE_TYPES: environment.validFileTypes,
  MAX_FILE_SIZE: environment.limits.maxFileSize,
  MAX_FILES: environment.limits.maxFiles,
  APP_NAME: environment.app.name,
  VERSION: environment.app.version,
} as const;

export const STORAGE_KEYS = {
  IS_LOGGED_IN: "isLoggedIn",
  USERNAME: "username",
  THEME: "theme",
  APP_SETTINGS: "appSettings",
} as const;

export const ROUTES = {
  LOGIN: "/login",
  HOME: "/",
  SETUP: "/Set-Up",
} as const;
```

### 5.4 Actualizar servicios que hacen peticiones HTTP

Ahora necesitas actualizar TODOS los servicios que hacen peticiones HTTP para usar `ApiUrlService`.

**Ejemplo - Archivo:** `nest-ui-fe/src/app/service/auth.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, firstValueFrom } from "rxjs";
import { STORAGE_KEYS, ROUTES } from "../config/app.constants";
import { ApiUrlService } from "./api-url.service"; // ✅ NUEVO

@Injectable({
  providedIn: "root",
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private apiUrlService: ApiUrlService, // ✅ NUEVO
  ) {}

  async login(username: string, password: string): Promise<boolean> {
    try {
      // ✅ CAMBIO: Obtener URL dinámicamente
      const apiUrl = await this.apiUrlService.getApiUrl();

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(
          `${apiUrl}/auth/login`, // ✅ CAMBIO: Usar URL dinámica
          { username, password },
        ),
      );

      if (response.success) {
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "true");
        localStorage.setItem(STORAGE_KEYS.USERNAME, username);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    this.router.navigate([ROUTES.LOGIN]);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === "true";
  }

  getUsername(): string | null {
    return localStorage.getItem(STORAGE_KEYS.USERNAME);
  }
}
```

**Repite este patrón para TODOS los servicios que hacen peticiones HTTP:**

- `FileProcessingService`
- `PdfGenerationService`
- `SettingsService`
- Cualquier otro servicio que use `HttpClient`

---

## 📝 Paso 6: Actualizar Servicios HTTP (Ejemplo Completo)

### 6.1 FileProcessingService

**Archivo:** `nest-ui-fe/src/app/service/home/file-processing.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ApiUrlService } from "../api-url.service"; // ✅ NUEVO

@Injectable({
  providedIn: "root",
})
export class FileProcessingService {
  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService, // ✅ NUEVO
  ) {}

  async processFiles(
    files: any[],
    basePath: string,
    selectedFacility: string,
  ): Promise<any> {
    // ✅ CAMBIO: Obtener URL dinámicamente
    const apiUrl = await this.apiUrlService.getApiUrl();

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file.file, file.name);
    });
    formData.append("basePath", basePath);
    formData.append("selectedFacility", selectedFacility);

    return firstValueFrom(
      this.http.post(`${apiUrl}/pdf/process-files`, formData), // ✅ CAMBIO
    );
  }

  async generatePdf(pdfData: any): Promise<any> {
    // ✅ CAMBIO: Obtener URL dinámicamente
    const apiUrl = await this.apiUrlService.getApiUrl();

    return firstValueFrom(
      this.http.post(`${apiUrl}/pdf/generate`, pdfData), // ✅ CAMBIO
    );
  }
}
```

---

## 🧪 Paso 7: Probar la Implementación

### 7.1 Compilar el proyecto

```powershell
# Desde la raíz del proyecto

# 1. Compila Frontend
cd nest-ui-fe
npm run build

# 2. Compila Backend
cd ../nest-ui-be
npm run build

# 3. Compila Electron
cd ../nest-electron
npm run build

# 4. Crea el instalador
npm run dist:win
```

### 7.2 Probar en desarrollo

```powershell
# Terminal 1: Backend
cd nest-ui-be
npm run start:dev

# Terminal 2: Frontend
cd nest-ui-fe
npm start

# Terminal 3: Electron
cd nest-electron
npm start
```

### 7.3 Probar conflicto de puerto

Para simular un conflicto de puerto:

```powershell
# Terminal 1: Ocupa el puerto 3000
python -m http.server 3000

# Terminal 2: Ejecuta tu app
cd nest-electron/release/win-unpacked
./Production\ Processing.exe
```

Deberías ver en los logs que la app usa el puerto 3001 automáticamente.

### 7.4 Verificar logs

```powershell
# Ver logs del backend
# Windows: %APPDATA%\Production Processing\backend.log
# O desde el menú: Ayuda > Ver Logs del Backend
```

Busca líneas como:

```
✅ Puerto 3000 está ocupado, intentando siguiente...
✅ Puerto 3001 está disponible
✅ Usando puerto: 3001
🚀 Backend corriendo en: http://localhost:3001
```

---

## 🐛 Solución de Problemas

### Problema: Frontend no puede conectar al backend

**Síntoma:** Errores de conexión en consola del navegador

**Solución:**

1. Abre DevTools (F12)
2. Verifica en consola:

```javascript
window.electronAPI
  .getBackendPort()
  .then((port) => console.log("Puerto:", port));
```

3. Debería mostrar el puerto correcto

### Problema: Backend no inicia en ningún puerto

**Síntoma:** App se cierra inmediatamente

**Solución:**

1. Verifica logs: `%APPDATA%\Production Processing\backend.log`
2. Asegúrate de que los puertos 3000-3010 no estén todos ocupados
3. Aumenta el rango en `findAvailablePort(3000, 3020)`

### Problema: En desarrollo siempre usa 3000

**Síntoma:** Conflicto en modo desarrollo

**Solución:**
Modifica `startBackend()` para buscar puerto también en desarrollo:

```typescript
if (isDev) {
  // ✅ CAMBIO: También buscar puerto en desarrollo
  const availablePort = await findAvailablePort(3000, 3010);
  BACKEND_PORT = availablePort || 3000;
  console.log(`Development mode: Using port ${BACKEND_PORT}`);
  return;
}
```

---

## 📊 Comparación

| Aspecto                  | Antes (Puerto Fijo) | Después (Puerto Dinámico) |
| ------------------------ | ------------------- | ------------------------- |
| Puerto siempre 3000      | ✅ Sí               | ❌ No                     |
| Falla si puerto ocupado  | ❌ Sí               | ✅ No                     |
| Busca puerto alternativo | ❌ No               | ✅ Sí (3000-3010)         |
| Frontend sabe el puerto  | ✅ Hardcoded        | ✅ Dinámico via IPC       |
| Funciona con otras apps  | ❌ Conflicto        | ✅ Sin conflicto          |

---

## ✅ Checklist de Implementación

- [ ] Crear `port-finder.ts` con funciones de búsqueda de puerto
- [ ] Actualizar `nest-electron/src/main.ts` con puerto dinámico
- [ ] Actualizar `nest-electron/src/preload.ts` con handler `getBackendPort`
- [ ] Crear `electron.d.ts` con tipos actualizados
- [ ] Crear `ApiUrlService` en Angular
- [ ] Actualizar `AuthService` para usar `ApiUrlService`
- [ ] Actualizar `FileProcessingService` para usar `ApiUrlService`
- [ ] Actualizar `PdfGenerationService` para usar `ApiUrlService`
- [ ] Actualizar cualquier otro servicio que haga peticiones HTTP
- [ ] Compilar y probar en desarrollo
- [ ] Compilar y probar en producción
- [ ] Probar con puerto 3000 ocupado
- [ ] Verificar logs del backend

---

## 🎯 Resultado Final

Tu aplicación ahora:

1. ✅ Busca automáticamente un puerto disponible (3000-3010)
2. ✅ Inicia el backend en ese puerto
3. ✅ Comunica el puerto al frontend via IPC
4. ✅ Frontend construye la URL dinámicamente
5. ✅ No falla si el puerto 3000 está ocupado
6. ✅ Funciona sin conflictos con otras aplicaciones

¡Tu app es ahora más robusta y profesional!
