# 🚀 Guía Completa: Empaquetar Electron para Producción

Esta guía te explica paso a paso cómo crear un instalador de tu aplicación para distribuirla a usuarios finales.

---

## 📋 Requisitos Previos

Antes de empaquetar, asegúrate de que todo funciona en desarrollo:

```powershell
# Terminal 1: Backend
cd nest-ui-be
npm run start:dev

# Terminal 2: Frontend
cd nest-ui-fe
npm start

# Terminal 3: Electron
cd nest-electron
npm run build
npm run dev
```

Si todo funciona correctamente, continúa con el empaquetado.

---

## 🎯 Paso 1: Preparar el Backend para Producción

### 1.1 Compilar el Backend

```powershell
cd nest-ui-be
npm run build
```

Esto crea la carpeta `nest-ui-be/dist/` con el código compilado.

### 1.2 Verificar que compile correctamente

```powershell
# Probar el backend compilado
node dist/main.js
```

Deberías ver:

```
[Nest] 12345  - 20/02/2024, 10:30:00     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 20/02/2024, 10:30:00     LOG [InstanceLoader] AppModule dependencies initialized
...
```

Presiona `Ctrl+C` para detenerlo.

---

## 🎨 Paso 2: Preparar el Frontend para Producción

### 2.1 Compilar el Frontend

```powershell
cd nest-ui-fe
npm run build
```

Esto crea la carpeta `nest-ui-fe/dist/nest-ui-fe/browser/` con los archivos HTML, CSS y JS.

### 2.2 Verificar la compilación

```powershell
# Ver los archivos generados
ls dist/nest-ui-fe/browser/
```

Deberías ver archivos como:

- `index.html`
- `main-XXXXX.js`
- `styles-XXXXX.css`
- etc.

---

## ⚡ Paso 3: Verificar Configuración de Electron

### 3.1 Revisar package.json

**Archivo:** `nest-electron/package.json`

Verifica que tenga esta configuración:

```json
{
  "name": "nest-electron",
  "version": "1.0.0",
  "description": "Production Processing Application",
  "author": "Tu Nombre o Empresa",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "start": "electron .",
    "dev": "npm run build && electron .",
    "pack": "npm run build && electron-builder --dir",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win"
  },
  "build": {
    "appId": "com.tuempresa.production-processing",
    "productName": "Production Processing",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": ["dist/**/*", "node_modules/**/*", "package.json"],
    "extraResources": [
      {
        "from": "../nest-ui-fe/dist/nest-ui-fe/browser",
        "to": "frontend",
        "filter": ["**/*"]
      },
      {
        "from": "../nest-ui-be/dist",
        "to": "backend/dist",
        "filter": ["**/*"]
      },
      {
        "from": "../nest-ui-be/node_modules",
        "to": "backend/node_modules",
        "filter": ["**/*"]
      },
      {
        "from": "../nest-ui-be/package.json",
        "to": "backend/package.json"
      },
      {
        "from": "../nest-files-py",
        "to": "python",
        "filter": ["**/*.py"]
      }
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "installerIcon": "build/icon.ico",
      "uninstallerIcon": "build/icon.ico"
    }
  }
}
```

### 3.2 Crear Icono de la Aplicación (Opcional)

Si quieres un icono personalizado:

1. Crea una carpeta `nest-electron/build/`
2. Coloca un archivo `icon.ico` (256x256 px) ahí
3. Puedes usar herramientas online para convertir PNG a ICO

Si no tienes icono, Electron usará uno por defecto.

---

## 📦 Paso 4: Compilar Todo

### 4.1 Script de Compilación Completo

Crea un archivo `build-all.ps1` en la raíz del proyecto:

```powershell
# build-all.ps1
Write-Host "🔨 Compilando Backend..." -ForegroundColor Cyan
cd nest-ui-be
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando Backend" -ForegroundColor Red
    exit 1
}

Write-Host "🎨 Compilando Frontend..." -ForegroundColor Cyan
cd ../nest-ui-fe
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando Frontend" -ForegroundColor Red
    exit 1
}

Write-Host "⚡ Compilando Electron..." -ForegroundColor Cyan
cd ../nest-electron
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host " Error compilando Electron" -ForegroundColor Red
    exit 1
}

Write-Host " Compilación completa exitosa!" -ForegroundColor Green
cd ..
```

### 4.2 Ejecutar la compilación

```powershell
# Dar permisos de ejecución (solo la primera vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ejecutar el script
.\build-all.ps1
```

---

## 🎁 Paso 5: Crear el Instalador

### 5.1 Empaquetar la aplicación

```powershell
cd nest-electron
npm run dist:win
```

Este comando:

1. Compila Electron
2. Empaqueta todo (Backend, Frontend, Python, node_modules)
3. Crea un instalador NSIS

**Tiempo estimado:** 5-15 minutos (dependiendo de tu PC)

### 5.2 Ubicación del instalador

El instalador se crea en:

```
nest-electron/release/Production Processing Setup 1.0.0.exe
```

---

## 🧪 Paso 6: Probar el Instalador

### 6.1 Instalar la aplicación

1. Navega a `nest-electron/release/`
2. Ejecuta `Production Processing Setup 1.0.0.exe`
3. Sigue el asistente de instalación
4. Elige la carpeta de instalación
5. Click en "Instalar"

### 6.2 Verificar la instalación

La aplicación se instala en:

```
C:\Users\TuUsuario\AppData\Local\Programs\production-processing\
```

Deberías tener un acceso directo en:

- Escritorio
- Menú Inicio

### 6.3 Probar la aplicación instalada

1. Abre la aplicación desde el acceso directo
2. Verifica que el backend inicie automáticamente
3. Prueba todas las funciones (saludar, generar PDF, etc.)
4. Revisa que los scripts Python funcionen

---

## 🐛 Solución de Problemas Comunes

### Problema 1: "Python no encontrado"

**Causa:** Python no está en el PATH del sistema

**Solución:**

1. El usuario debe instalar Python desde https://www.python.org/downloads/
2. Durante la instalación, marcar "Add Python to PATH"
3. Reiniciar la aplicación

**Alternativa:** Empaquetar Python con la aplicación (ver sección avanzada)

### Problema 2: "Backend no inicia"

**Causa:** Falta alguna dependencia de Node.js

**Solución:**
Verifica que `extraResources` en `package.json` incluya:

```json
{
  "from": "../nest-ui-be/node_modules",
  "to": "backend/node_modules",
  "filter": ["**/*"]
}
```

### Problema 3: "Frontend muestra pantalla en blanco"

**Causa:** Rutas incorrectas en producción

**Solución:**
Verifica en `nest-electron/src/main.ts`:

```typescript
if (isDev) {
  mainWindow.loadURL("http://localhost:4200");
} else {
  const frontendPath = path.join(
    process.resourcesPath,
    "frontend",
    "index.html",
  );
  mainWindow.loadFile(frontendPath);
}
```

### Problema 4: "Scripts Python no funcionan"

**Causa:** Rutas incorrectas en producción

**Solución:**
Verifica en `nest-ui-be/src/python/python.service.ts`:

```typescript
private readonly scriptsPath = path.resolve(
  __dirname,
  '../../../nest-files-py',
);
```

En producción, los scripts están en:

```typescript
// Detectar si está en producción
const isProduction = !process.env.NODE_ENV || process.env.NODE_ENV === 'production';

private readonly scriptsPath = isProduction
  ? path.join(process.resourcesPath, 'python')
  : path.resolve(__dirname, '../../../nest-files-py');
```

---

## 🔧 Configuración Avanzada

### Incluir Python Portable (Opcional)

Si quieres que la aplicación incluya Python:

1. Descarga Python Embeddable: https://www.python.org/downloads/windows/
2. Extrae en `nest-electron/python-portable/`
3. Agrega a `extraResources`:

```json
{
  "from": "python-portable",
  "to": "python-portable",
  "filter": ["**/*"]
}
```

4. Modifica `python.service.ts`:

```typescript
private readonly pythonPath = process.platform === 'win32'
  ? path.join(process.resourcesPath, 'python-portable', 'python.exe')
  : 'python3';
```

### Firmar el Instalador (Opcional)

Para evitar advertencias de Windows SmartScreen:

1. Obtén un certificado de firma de código
2. Agrega a `package.json`:

```json
"win": {
  "certificateFile": "path/to/certificate.pfx",
  "certificatePassword": "password",
  "signingHashAlgorithms": ["sha256"]
}
```

### Auto-actualización (Opcional)

Para que la app se actualice automáticamente:

1. Instala `electron-updater`:

```powershell
cd nest-electron
npm install electron-updater
```

2. Configura en `main.ts`:

```typescript
import { autoUpdater } from "electron-updater";

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

---

## 📝 Checklist de Producción

Antes de distribuir:

- [ ] Backend compila sin errores
- [ ] Frontend compila sin errores
- [ ] Electron compila sin errores
- [ ] Todas las funciones probadas en desarrollo
- [ ] Scripts Python probados
- [ ] Instalador creado exitosamente
- [ ] Aplicación instalada y probada
- [ ] Backend inicia automáticamente
- [ ] Frontend carga correctamente
- [ ] Scripts Python funcionan
- [ ] Icono personalizado (opcional)
- [ ] Versión actualizada en package.json
- [ ] README con instrucciones para usuarios
- [ ] Documentación de instalación de Python

---

## 📦 Distribución

### Opción 1: Compartir el Instalador

Simplemente comparte el archivo `.exe`:

```
nest-electron/release/Production Processing Setup 1.0.0.exe
```

### Opción 2: Crear ZIP Portable

Si prefieres una versión portable sin instalador:

```powershell
cd nest-electron
npm run pack
```

Esto crea:

```
nest-electron/release/win-unpacked/
```

Comprime esa carpeta en un ZIP y distribúyela.

### Opción 3: Subir a un Servidor

Sube el instalador a:

- Google Drive
- Dropbox
- Tu propio servidor web
- GitHub Releases

---

## 🔄 Actualizar la Aplicación

Para crear una nueva versión:

1. Actualiza la versión en `nest-electron/package.json`:

```json
{
  "version": "1.1.0"
}
```

2. Compila todo de nuevo:

```powershell
.\build-all.ps1
cd nest-electron
npm run dist:win
```

3. El nuevo instalador será:

```
Production Processing Setup 1.1.0.exe
```

---

## 📊 Tamaño del Instalador

Tamaño aproximado:

- Electron + Chromium: ~150 MB
- Backend (NestJS + node_modules): ~50-100 MB
- Frontend (Angular compilado): ~5-10 MB
- Scripts Python: <1 MB

**Total:** ~200-250 MB

Para reducir el tamaño:

- Usa `npm prune --production` en backend
- Elimina dependencias de desarrollo
- Comprime assets del frontend

---

## 🎯 Script Completo de Empaquetado

Crea `package-app.ps1`:

```powershell
# package-app.ps1
Write-Host "🚀 Iniciando empaquetado de producción..." -ForegroundColor Cyan

# Limpiar builds anteriores
Write-Host "🧹 Limpiando builds anteriores..." -ForegroundColor Yellow
Remove-Item -Path "nest-ui-be/dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "nest-ui-fe/dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "nest-electron/dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "nest-electron/release" -Recurse -Force -ErrorAction SilentlyContinue

# Compilar Backend
Write-Host "🔨 Compilando Backend..." -ForegroundColor Cyan
cd nest-ui-be
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando Backend" -ForegroundColor Red
    exit 1
}

# Compilar Frontend
Write-Host "🎨 Compilando Frontend..." -ForegroundColor Cyan
cd ../nest-ui-fe
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando Frontend" -ForegroundColor Red
    exit 1
}

# Empaquetar Electron
Write-Host "⚡ Empaquetando Electron..." -ForegroundColor Cyan
cd ../nest-electron
npm run dist:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error empaquetando Electron" -ForegroundColor Red
    exit 1
}

Write-Host "✅ ¡Empaquetado completo!" -ForegroundColor Green
Write-Host "📦 Instalador creado en: nest-electron/release/" -ForegroundColor Green

# Mostrar información del instalador
$installer = Get-ChildItem -Path "release" -Filter "*.exe" | Select-Object -First 1
if ($installer) {
    Write-Host "📄 Archivo: $($installer.Name)" -ForegroundColor Cyan
    Write-Host "📊 Tamaño: $([math]::Round($installer.Length / 1MB, 2)) MB" -ForegroundColor Cyan
}

cd ..
```

**Ejecutar:**

```powershell
.\package-app.ps1
```

---

## ✅ Resultado Final

Después de seguir esta guía tendrás:

1. ✅ Un instalador `.exe` profesional
2. ✅ Aplicación que funciona sin dependencias externas (excepto Python)
3. ✅ Accesos directos en escritorio y menú inicio
4. ✅ Backend que inicia automáticamente
5. ✅ Frontend integrado
6. ✅ Scripts Python funcionando

---

## 📚 Recursos Adicionales

- [Electron Builder Docs](https://www.electron.build/)
- [Electron Docs](https://www.electronjs.org/docs/latest/)
- [NSIS Installer](https://nsis.sourceforge.io/Main_Page)

---

**¡Listo para producción!** 🎉

Tu aplicación está lista para ser distribuida a usuarios finales.
