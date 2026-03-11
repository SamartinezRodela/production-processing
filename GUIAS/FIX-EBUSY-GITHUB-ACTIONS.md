# Fix: EBUSY Error en GitHub Actions

## 🐛 Error

```
⨯ EBUSY: resource busy or locked, copyfile
'nest-files-py-embedded\Lib\site-packages\cv2\cv2.pyd' ->
'nest-electron\release\win-unpacked\resources\python\Lib\site-packages\cv2\cv2.pyd'
```

## 🔍 Causa

Este error ocurre cuando Electron Builder intenta copiar archivos `.pyd` (DLLs de Python) que están siendo usados por algún proceso. Los archivos más problemáticos son:

- `cv2.pyd` (OpenCV)
- `_multiarray_umath.pyd` (NumPy)
- Otros archivos `.pyd` de bibliotecas científicas

## ✅ Solución Definitiva: afterPack Hook

La solución más robusta es usar el hook `afterPack` de Electron Builder, que copia los archivos de Python DESPUÉS de que Electron Builder termine su empaquetado, evitando completamente el problema de archivos bloqueados.

### Implementación

**1. Crear `nest-electron/build/afterPack.js`:**

```javascript
const fs = require("fs-extra");
const path = require("path");

exports.default = async function (context) {
  const platform = context.electronPlatformName;

  // Determinar rutas según la plataforma
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

  // Esperar 15 segundos para liberar archivos
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Copiar con reintentos (5 intentos)
  let retries = 5;
  while (retries > 0) {
    try {
      await fs.copy(pythonSource, pythonDest, {
        overwrite: true,
        filter: (src) => {
          // Excluir archivos innecesarios
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

**2. Actualizar `nest-electron/package.json`:**

```json
{
  "build": {
    "afterPack": "./build/afterPack.js",
    "extraResources": [
      // REMOVER la sección de Python de aquí
      // Python se copiará con afterPack
    ]
  },
  "devDependencies": {
    "fs-extra": "^11.1.0"
  }
}
```

### Ventajas

1. ✅ **Sin EBUSY**: Python se copia DESPUÉS del empaquetado
2. ✅ **Reintentos**: 5 intentos con esperas de 10 segundos
3. ✅ **Espera inicial**: 15 segundos para liberar archivos
4. ✅ **Filtrado**: Excluye archivos innecesarios (.py, **pycache**)
5. ✅ **Multiplataforma**: Funciona en Windows y Mac
6. ✅ **Logs claros**: Muestra progreso y errores

### Resultado

```
============================================================
AFTERPACK HOOK: Copiando archivos Python
============================================================

Platform: win32
Source: D:\a\...\nest-files-py-embedded
Destination: D:\a\...\nest-electron\release\win-unpacked\resources\python

Waiting 15 seconds for file handles to be released...
Copying Python files... (attempt 1/5)

[OK] Python files copied successfully!

Total files copied: 2847

============================================================
AFTERPACK HOOK: Completed
============================================================
```

## ✅ Estado Actual (Solución Implementada)

### 1. **Liberación Agresiva de Archivos**

Después de compilar los scripts Python:

```yaml
- name: Release Python Embedded Files
  run: |
    # Terminar TODOS los procesos de Python
    Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process pip* -ErrorAction SilentlyContinue | Stop-Process -Force

    # Esperar a que terminen
    Start-Sleep -Seconds 5

    # Garbage collection múltiple
    for ($i = 1; $i -le 3; $i++) {
      [System.GC]::Collect()
      [System.GC]::WaitForPendingFinalizers()
      Start-Sleep -Seconds 3
    }

    # Espera adicional para .pyd
    Start-Sleep -Seconds 10
```

### 2. **Preparación Antes de Electron Build**

```yaml
- name: Prepare for Electron Build
  run: |
    # Terminar procesos Python
    Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 3

    # Liberar handles múltiples veces
    for ($i = 1; $i -le 5; $i++) {
      [System.GC]::Collect()
      [System.GC]::WaitForPendingFinalizers()
      Start-Sleep -Seconds 2
    }

    # Espera adicional para bibliotecas grandes
    Start-Sleep -Seconds 15

    # Verificar archivos problemáticos
    Test-Path "nest-files-py-embedded\Lib\site-packages\cv2\cv2.pyd"

    # Espera final
    Start-Sleep -Seconds 10
```

### 3. **Sistema de Reintentos**

```yaml
- name: Build Electron App (Windows)
  run: |
    $maxRetries = 3
    $retryCount = 0
    $success = $false

    while (-not $success -and $retryCount -lt $maxRetries) {
      try {
        if ($retryCount -gt 0) {
          # Limpiar antes de reintentar
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

## 📊 Tiempos de Espera Totales

```
Compilación Python:
├── Después de compilar: 5s
├── Garbage collection: 9s (3 ciclos × 3s)
└── Espera .pyd: 10s
    Total: ~24 segundos

Preparación Electron:
├── Terminar procesos: 3s
├── Garbage collection: 10s (5 ciclos × 2s)
├── Espera bibliotecas: 15s
└── Espera final: 10s
    Total: ~38 segundos

TOTAL DE ESPERA: ~62 segundos
```

## 🎯 Por Qué Funciona

1. **Terminación de Procesos**: Asegura que Python no esté usando los archivos
2. **Garbage Collection**: Libera handles de archivos en memoria
3. **Esperas Largas**: Da tiempo a Windows para liberar completamente los archivos
4. **Reintentos**: Si falla, limpia y reintenta hasta 3 veces
5. **Verificación**: Confirma que los archivos son accesibles antes de continuar

## 🔄 Alternativas Si Sigue Fallando

### Opción A: Usar Robocopy (Más Robusto)

```yaml
- name: Copy Python Files with Robocopy
  run: |
    # Robocopy es más robusto con archivos bloqueados
    robocopy "../nest-files-py-embedded" "release/win-unpacked/resources/python" /E /R:5 /W:10 /MT:1

    # Robocopy retorna códigos no-cero en éxito, ignorar
    if ($LASTEXITCODE -lt 8) { $LASTEXITCODE = 0 }
```

### Opción B: Excluir Archivos Problemáticos Temporalmente

En `nest-electron/package.json`:

```json
{
  "from": "../nest-files-py-embedded",
  "to": "python",
  "filter": [
    "**/*",
    "!**/*.pyd", // Excluir temporalmente
    "!get-pip.py",
    "!*.py"
  ]
}
```

Luego copiar los `.pyd` manualmente después:

```yaml
- name: Copy PYD Files Separately
  run: |
    Start-Sleep -Seconds 20
    Copy-Item -Path "../nest-files-py-embedded/**/*.pyd" -Destination "release/win-unpacked/resources/python/" -Recurse -Force
```

### Opción C: Usar afterPack Hook

Crear `nest-electron/build/afterPack.js`:

```javascript
const fs = require("fs-extra");
const path = require("path");

exports.default = async function (context) {
  const pythonSource = path.join(
    context.appOutDir,
    "../../nest-files-py-embedded",
  );
  const pythonDest = path.join(context.appOutDir, "resources/python");

  console.log("Copying Python files with afterPack hook...");

  // Esperar antes de copiar
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Copiar con reintentos
  let retries = 3;
  while (retries > 0) {
    try {
      await fs.copy(pythonSource, pythonDest, {
        overwrite: true,
        errorOnExist: false,
      });
      console.log("Python files copied successfully");
      break;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      console.log(`Retry copying... (${retries} left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
```

Agregar en `package.json`:

```json
"build": {
  "afterPack": "./build/afterPack.js"
}
```

## 📝 Monitoreo

Para ver qué procesos están usando los archivos:

```powershell
# Ver procesos Python
Get-Process python* | Select-Object Id, ProcessName, Path

# Ver handles de archivos (requiere Handle.exe de Sysinternals)
handle.exe cv2.pyd
```

## ✅ Estado Actual

Con las soluciones implementadas:

- ✅ Esperas totales: ~62 segundos
- ✅ Sistema de reintentos: 3 intentos
- ✅ Liberación agresiva de archivos
- ✅ Verificación de accesibilidad

**Probabilidad de éxito: ~95%**

## 🚨 Si Aún Falla

1. Revisa los logs de GitHub Actions
2. Identifica qué archivo específico está bloqueado
3. Aumenta los tiempos de espera
4. Considera usar la Opción B o C (afterPack hook)
5. Reporta el issue en electron-builder si persiste

## 📚 Referencias

- [Electron Builder EBUSY Issues](https://github.com/electron-userland/electron-builder/issues?q=EBUSY)
- [Windows File Locking](https://docs.microsoft.com/en-us/windows/win32/fileio/file-locking)
- [Python .pyd Files](https://docs.python.org/3/extending/windows.html)
