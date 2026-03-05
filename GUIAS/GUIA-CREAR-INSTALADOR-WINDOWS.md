# Guía: Crear Instalador de Windows con Electron

## 🎯 Objetivo

Crear un instalador `.exe` para Windows que incluya:

- Tu aplicación Electron
- Backend NestJS
- Frontend Angular
- Python embebido
- Todo listo para distribuir

---

## 📋 Requisitos Previos

### Software Necesario

- ✅ Node.js 18+ instalado
- ✅ npm instalado
- ✅ Python embebido configurado (`nest-files-py-embedded/`)
- ✅ Proyecto compilado (backend + frontend)

### Verificar Instalación

```powershell
node --version    # Debe mostrar v18.x o superior
npm --version     # Debe mostrar 9.x o superior
```

---

## 🚀 Proceso Completo

### Paso 1: Solucionar Error EBUSY (IMPORTANTE)

**El error más común es que Windows Defender bloquea archivos.**

**Solución A: Agregar Exclusión (Recomendado)**

```powershell
# Ejecutar como Administrador
.\FILES_PS\agregar-exclusion-antivirus.ps1
```

**Solución B: Manual**

1. Abrir Windows Security
2. Protección contra virus y amenazas
3. Administrar configuración
4. Agregar o quitar exclusiones
5. Agregar una exclusión → Carpeta
6. Seleccionar: `C:\Projects\NEST-UI-V2\nest-files-py-embedded`

---

### Paso 2: Ejecutar Script de Empaquetado

**Opción 1: Script Automático (Recomendado)**

```powershell
# Compila todo y crea el instalador
.\FILES_PS\fix-and-package.ps1
```

**Opción 2: Script Ultimate (Si falla el anterior)**

```powershell
# Ejecutar como Administrador
.\FILES_PS\package-app-ultimate.ps1
```

**Opción 3: Paso a Paso Manual**

```powershell
# 1. Compilar Backend
cd nest-ui-be
npm run build

# 2. Compilar Frontend
cd ../nest-ui-fe
npm run build

# 3. Empaquetar Electron
cd ../nest-electron
npm run dist:win
```

---

### Paso 3: Verificar Resultado

Si todo sale bien, verás:

```
nest-electron/release/
├── Production Processing Setup 1.0.0.exe    ← INSTALADOR
├── Production Processing Setup 1.0.0.exe.blockmap
└── win-unpacked/                            ← Versión portable
    ├── Production Processing.exe
    └── resources/
        ├── app.asar
        ├── frontend/
        ├── backend/
        └── python/
```

---

## 📦 Tipos de Instaladores

### NSIS Installer (.exe)

**Archivo:** `Production Processing Setup 1.0.0.exe`

**Características:**

- ✅ Instalador tradicional de Windows
- ✅ Permite elegir carpeta de instalación
- ✅ Crea accesos directos en escritorio y menú inicio
- ✅ Incluye desinstalador
- ✅ Tamaño: ~150-200 MB

**Uso:**

```
Usuario hace doble clic → Asistente de instalación → Instala en Program Files
```

---

### Portable (win-unpacked/)

**Carpeta:** `win-unpacked/`

**Características:**

- ✅ No requiere instalación
- ✅ Se ejecuta directamente
- ✅ Portable (copiar a USB)
- ✅ No crea entradas en registro

**Uso:**

```
Usuario copia carpeta → Ejecuta Production Processing.exe
```

---

## ⚙️ Configuración de electron-builder

### Archivo: `nest-electron/package.json`

```json
{
  "build": {
    "appId": "com.yourcompany.nest-ui",
    "productName": "Production Processing",

    "win": {
      "target": "nsis",
      "arch": ["x64"]
    },

    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

---

## 🎨 Personalización

### Cambiar Nombre de la App

**Editar:** `nest-electron/package.json`

```json
{
  "build": {
    "productName": "Mi Aplicacion", // ← Cambiar aquí
    "appId": "com.miempresa.miapp"
  }
}
```

---

### Cambiar Versión

```json
{
  "version": "1.0.0" // ← Cambiar aquí
}
```

El instalador se llamará: `Mi Aplicacion Setup 1.0.0.exe`

---

### Agregar Icono

**1. Crear iconos:**

- Windows: `icon.ico` (256x256)
- Mac: `icon.icns`

**2. Colocar en:**

```
nest-electron/build/
├── icon.ico
└── icon.icns
```

**3. Configurar:**

```json
{
  "build": {
    "win": {
      "icon": "build/icon.ico"
    },
    "nsis": {
      "installerIcon": "build/icon.ico",
      "uninstallerIcon": "build/icon.ico"
    }
  }
}
```

---

## 🔧 Opciones Avanzadas

### Instalador de Un Click

```json
{
  "nsis": {
    "oneClick": true, // Sin opciones, instala directo
    "perMachine": true // Instalar para todos los usuarios
  }
}
```

---

### Firma Digital

**Para evitar advertencias de Windows SmartScreen:**

```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "password",
    "signingHashAlgorithms": ["sha256"]
  }
}
```

**Costo:** $200-500/año para certificado de código

---

### Actualización Automática

```json
{
  "publish": {
    "provider": "github",
    "owner": "tu-usuario",
    "repo": "tu-repo"
  }
}
```

---

## 🐛 Solución de Problemas

### Error: EBUSY (Archivo Bloqueado)

**Causa:** Windows Defender o proceso usando archivos

**Solución:**

```powershell
# 1. Agregar exclusión
.\FILES_PS\agregar-exclusion-antivirus.ps1

# 2. Cerrar procesos
Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process -Force

# 3. Reintentar
.\FILES_PS\fix-and-package.ps1
```

**Ver guía completa:** `GUIAS/SOLUCION-ERROR-EBUSY-PACKAGE.md`

---

### Error: Python no encontrado

**Causa:** Falta Python embebido

**Solución:**

```
Verificar que existe: nest-files-py-embedded/python.exe
```

---

### Error: Backend/Frontend no compilado

**Causa:** Faltan archivos dist/

**Solución:**

```powershell
# Compilar manualmente
cd nest-ui-be
npm run build

cd ../nest-ui-fe
npm run build
```

---

### Instalador muy grande

**Causa:** Incluye node_modules completo

**Solución:** Optimizar en `package.json`:

```json
{
  "build": {
    "files": [
      "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
      "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
      "!**/node_modules/*.d.ts",
      "!**/node_modules/.bin"
    ]
  }
}
```

---

## 📊 Tamaños Típicos

| Componente         | Tamaño      |
| ------------------ | ----------- |
| Electron base      | ~80 MB      |
| Backend (NestJS)   | ~30 MB      |
| Frontend (Angular) | ~5 MB       |
| Python embebido    | ~50 MB      |
| Node modules       | ~30 MB      |
| **Total**          | **~195 MB** |

---

## 🚀 Distribución

### Opción 1: Enviar Instalador

```
Enviar: Production Processing Setup 1.0.0.exe
Usuario: Doble clic → Instalar → Listo
```

---

### Opción 2: Versión Portable

```
Comprimir: win-unpacked/ → Production-Processing-Portable.zip
Usuario: Descomprimir → Ejecutar Production Processing.exe
```

---

### Opción 3: Subir a GitHub Releases

```powershell
# 1. Crear release en GitHub
# 2. Subir instalador
# 3. Usuarios descargan desde GitHub
```

---

## 📝 Checklist Pre-Distribución

Antes de distribuir tu instalador:

- [ ] Probado en PC limpia (sin Node.js instalado)
- [ ] Probado instalación y desinstalación
- [ ] Verificado que Python embebido funciona
- [ ] Verificado que genera PDFs correctamente
- [ ] Probado en Windows 10 y Windows 11
- [ ] Icono personalizado agregado
- [ ] Versión actualizada en package.json
- [ ] Firmado digitalmente (opcional pero recomendado)

---

## 🎯 Comandos Rápidos

```powershell
# Desarrollo
npm run dev                    # Ejecutar en modo desarrollo

# Empaquetado
.\FILES_PS\fix-and-package.ps1 # Crear instalador (recomendado)
npm run dist:win               # Solo empaquetar Electron

# Limpieza
Remove-Item nest-electron\release -Recurse -Force

# Verificar
Get-ChildItem nest-electron\release  # Ver archivos generados
```

---

## 📚 Recursos Adicionales

- **electron-builder docs:** https://www.electron.build/
- **NSIS options:** https://www.electron.build/configuration/nsis
- **Firma de código:** `GUIAS/GUIA-FIRMAR-EJECUTABLES.md`
- **Solución EBUSY:** `GUIAS/SOLUCION-ERROR-EBUSY-PACKAGE.md`

---

## ✅ Resumen

**Para crear el instalador:**

1. Agregar exclusión de antivirus
2. Ejecutar `.\FILES_PS\fix-and-package.ps1`
3. Esperar 5-10 minutos
4. Instalador estará en `nest-electron/release/`

**Resultado:**

- `Production Processing Setup 1.0.0.exe` - Instalador
- `win-unpacked/` - Versión portable

**Listo para distribuir!** 🚀

---

**Fecha:** Marzo 2026  
**Versión:** 1.0.0
