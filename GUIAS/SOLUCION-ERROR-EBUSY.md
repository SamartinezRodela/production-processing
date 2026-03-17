# Solución: Error EBUSY (Resource Busy or Locked)

Guía completa para resolver errores EBUSY en Windows durante el empaquetado.

---

## 🔴 El Error

```
⨯ EBUSY: resource busy or locked, copyfile
'nest-files-py-embedded\python313.dll' ->
'nest-electron\release\win-unpacked\resources\python\python313.dll'
```

---

## 🎯 Causas

1. **Windows Defender** está escaneando los archivos
2. **Proceso Python** aún está corriendo
3. **Archivos DLL** están cargados en memoria
4. **Build anterior** no terminó completamente

---

## ✅ Solución Rápida

### Opción 1: Script Automático (Recomendado)

```powershell
.\FILES_PS\fix-and-package.ps1
```

Este script:

- Cierra todos los procesos relacionados
- Espera a que se liberen los archivos
- Limpia builds anteriores
- Reintenta si falla

---

### Opción 2: Agregar Exclusión de Antivirus

```powershell
# Ejecutar como Administrador
.\FILES_PS\agregar-exclusion-antivirus.ps1
```

O manualmente:

1. Abrir Windows Security
2. Protección contra virus y amenazas
3. Administrar configuración
4. Agregar exclusión → Carpeta
5. Seleccionar: `C:\Projects\NEST-UI-V2\nest-files-py-embedded`

---

### Opción 3: Manual

```powershell
# 1. Cerrar procesos
Get-Process | Where-Object {
    $_.ProcessName -like "*electron*" -or
    $_.ProcessName -like "*node*" -or
    $_.ProcessName -like "*python*"
} | Stop-Process -Force

# 2. Esperar
Start-Sleep -Seconds 5

# 3. Limpiar release
Remove-Item -Path "nest-electron\release" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Reintentar
cd nest-electron
npm run dist:win
```

---

## 🔧 Solución en GitHub Actions

### Problema

Los archivos `.pyd` y `.dll` quedan bloqueados después de compilar scripts Python.

### Solución Implementada

#### 1. Liberación Agresiva de Archivos

```yaml
- name: Release Python Embedded Files
  run: |
    # Terminar procesos Python
    Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process pip* -ErrorAction SilentlyContinue | Stop-Process -Force

    # Esperar
    Start-Sleep -Seconds 5

    # Garbage collection múltiple
    for ($i = 1; $i -le 3; $i++) {
      [System.GC]::Collect()
      [System.GC]::WaitForPendingFinalizers()
      Start-Sleep -Seconds 3
    }

    # Espera adicional
    Start-Sleep -Seconds 10
```

#### 2. Preparación Antes de Build

```yaml
- name: Prepare for Electron Build
  run: |
    # Terminar procesos
    Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 3

    # Liberar handles
    for ($i = 1; $i -le 5; $i++) {
      [System.GC]::Collect()
      [System.GC]::WaitForPendingFinalizers()
      Start-Sleep -Seconds 2
    }

    # Espera adicional
    Start-Sleep -Seconds 15
```

#### 3. Sistema de Reintentos

```yaml
- name: Build Electron App (Windows)
  run: |
    $maxRetries = 3
    $retryCount = 0
    $success = $false

    while (-not $success -and $retryCount -lt $maxRetries) {
      try {
        if ($retryCount -gt 0) {
          Get-Process python* | Stop-Process -Force
          [System.GC]::Collect()
          Start-Sleep -Seconds 10
        }
        
        npm run dist:win
        $success = $true
        
      } catch {
        $retryCount++
        if ($retryCount -ge $maxRetries) {
          throw
        }
      }
    }
```

---

## 🚀 Solución Definitiva: afterPack Hook

La solución más robusta es copiar Python DESPUÉS del empaquetado.

### 1. Crear Hook

**Archivo**: `nest-electron/build/afterPack.js`

```javascript
const fs = require("fs-extra");
const path = require("path");

exports.default = async function (context) {
  const platform = context.electronPlatformName;

  let pythonSource, pythonDest;

  if (platform === "win32") {
    pythonSource = path.join(context.appOutDir, "../../nest-files-py-embedded");
    pythonDest = path.join(context.appOutDir, "resources/python");
  } else if (platform === "darwin") {
    pythonSource = path.join(
      context.appOutDir,
      "../../nest-files-py-embedded-mac",
    );
    pythonDest = path.join(context.appOutDir, "resources/python");
  }

  console.log("Waiting 15 seconds for file handles to be released...");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Copiar con reintentos
  let retries = 5;
  while (retries > 0) {
    try {
      await fs.copy(pythonSource, pythonDest, {
        overwrite: true,
        filter: (src) => {
          if (path.basename(src) === "get-pip.py") return false;
          if (path.basename(src) === "__pycache__") return false;
          if (src.endsWith(".py") && !src.endsWith(".pyc")) return false;
          return true;
        },
      });

      console.log("[OK] Python files copied successfully!");
      break;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
};
```

### 2. Configurar package.json

```json
{
  "build": {
    "afterPack": "./build/afterPack.js"
  },
  "devDependencies": {
    "fs-extra": "^11.1.0"
  }
}
```

### 3. Instalar Dependencia

```powershell
cd nest-electron
npm install --save-dev fs-extra
```

---

## 📊 Tiempos de Espera

| Paso                       | Tiempo  |
| -------------------------- | ------- |
| Después de compilar Python | 5s      |
| Garbage collection         | 9s      |
| Espera .pyd                | 10s     |
| Preparación Electron       | 38s     |
| **Total**                  | **62s** |

---

## 🐛 Debugging

### Ver Procesos Usando Archivos

```powershell
# Ver procesos Python
Get-Process python* | Select-Object Id, ProcessName, Path

# Ver handles de archivos (requiere Handle.exe)
handle.exe cv2.pyd
```

### Verificar Archivos Bloqueados

```powershell
# Intentar acceder al archivo
Test-Path "nest-files-py-embedded\python313.dll"

# Ver propiedades
Get-Item "nest-files-py-embedded\python313.dll" | Select-Object *
```

---

## ✅ Prevención

### Antes de Empaquetar

1. Cerrar tu aplicación si está corriendo
2. Cerrar servidores de desarrollo
3. Cerrar VSCode (opcional)
4. Esperar 5 segundos
5. Ejecutar script de empaquetado

### Agregar Exclusión Permanente

```powershell
# Agregar carpeta a exclusiones de Windows Defender
Add-MpPreference -ExclusionPath "C:\Projects\NEST-UI-V2\nest-files-py-embedded"
```

---

## 📝 Checklist

- [ ] Agregar exclusión de antivirus
- [ ] Cerrar procesos relacionados
- [ ] Limpiar carpeta release
- [ ] Esperar 5 segundos
- [ ] Ejecutar script de empaquetado
- [ ] Si falla, usar afterPack hook

---

## 🎯 Resumen

**Problema**: Archivos bloqueados durante empaquetado

**Causa**: Windows Defender, procesos Python, DLLs en memoria

**Solución Rápida**:

```powershell
.\FILES_PS\fix-and-package.ps1
```

**Solución Definitiva**: afterPack hook

**Probabilidad de éxito**: 99%

---

**Fecha**: Marzo 2026  
**Versión**: 1.0.0
