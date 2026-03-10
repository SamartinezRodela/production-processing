# 🔧 Fix: EBUSY Error en Windows Build

## ❌ Problema Encontrado

Al ejecutar el build de Electron en GitHub Actions (Windows), apareció este error:

```
⨯ EBUSY: resource busy or locked, copyfile
'nest-files-py-embedded\python313.dll' ->
'nest-electron\release\win-unpacked\resources\python\python313.dll'
```

### Causa

El error `EBUSY` (resource busy) ocurre cuando:

1. Un archivo está siendo usado por otro proceso
2. Windows no ha liberado completamente los handles de archivo
3. El script de compilación Python deja archivos abiertos

En este caso:

- El script `compile-python-scripts.py` lee archivos Python
- Windows no libera inmediatamente los handles
- `electron-builder` intenta copiar los mismos archivos
- Resultado: conflicto de acceso

## ✅ Soluciones Aplicadas

### 1. Cerrar Archivos Explícitamente en Python

**Archivo:** `compile-python-scripts.py`

```python
def calculate_hash(file_path: Path) -> str:
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)

    # Asegurar que el archivo se cierre completamente
    return sha256_hash.hexdigest()

# Al final del script
import gc
gc.collect()  # Forzar garbage collection
```

### 2. Esperar Después de Compilación

**Archivo:** `.github/workflows/build-windows.yml`

```yaml
- name: Compile Python Scripts to Bytecode
  run: |
    # Ejecutar con Start-Process y -Wait
    $process = Start-Process -FilePath "python" `
      -ArgumentList "compile-python-scripts.py" `
      -NoNewWindow -Wait -PassThru

    # Esperar a que Python libere archivos
    Start-Sleep -Seconds 2
```

### 3. Liberar Handles Antes de Build

```yaml
- name: Release Python Embedded Files
  run: |
    # Forzar garbage collection
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()

    Start-Sleep -Seconds 2
```

### 4. Preparación Antes de Electron Build

```yaml
- name: Prepare for Electron Build
  run: |
    # Liberar handles múltiples veces
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    [System.GC]::Collect()

    # Esperar más tiempo
    Start-Sleep -Seconds 3

    # Verificar accesibilidad
    $fileCount = (Get-ChildItem -Path "nest-files-py-embedded" -Recurse -File).Count
    Write-Host "[OK] Python embebido listo: $fileCount archivos"
```

## 📋 Cambios Realizados

### Archivos Modificados

```
✓ compile-python-scripts.py
  - Agregado gc.collect() al final
  - Asegurar cierre de archivos

✓ .github/workflows/build-windows.yml
  - Paso: Release Python Embedded Files
  - Paso: Prepare for Electron Build
  - Modificado: Compile Python Scripts (usar Start-Process -Wait)
```

## 🔄 Flujo Mejorado

### Antes (con error)

```
1. Compilar Python scripts
2. Inmediatamente: Build Electron
3. ❌ EBUSY: archivos bloqueados
```

### Después (sin error)

```
1. Compilar Python scripts
2. Esperar 2 segundos
3. Liberar handles (GC)
4. Esperar 2 segundos
5. Build Backend/Frontend
6. Liberar handles (GC x3)
7. Esperar 3 segundos
8. ✅ Build Electron (archivos liberados)
```

## 🧪 Verificación

### Localmente (Windows)

```powershell
# Compilar scripts
python compile-python-scripts.py

# Esperar
Start-Sleep -Seconds 2

# Verificar que archivos son accesibles
Get-ChildItem nest-files-py-embedded\*.pyc
```

### En GitHub Actions

El workflow ahora incluye:

- ✅ Esperas estratégicas
- ✅ Garbage collection forzado
- ✅ Verificación de accesibilidad
- ✅ Logs detallados

## 💡 Por Qué Funciona

### Windows File Locking

Windows mantiene handles de archivo abiertos por un tiempo después de cerrarlos:

- **Problema:** Proceso A cierra archivo → Windows mantiene handle → Proceso B no puede acceder
- **Solución:** Esperar + Forzar GC → Windows libera handle → Proceso B puede acceder

### Garbage Collection

Python usa conteo de referencias:

- `with open()` cierra el archivo
- Pero el objeto puede quedar en memoria
- `gc.collect()` fuerza limpieza inmediata
- Windows libera el handle

### Start-Process -Wait

PowerShell normal:

- `python script.py` → Puede retornar antes de que Python termine completamente

Con `-Wait`:

- `Start-Process -Wait` → Espera a que el proceso termine COMPLETAMENTE
- Asegura que todos los handles estén cerrados

## 📊 Tiempos de Espera

| Paso                   | Espera | Razón                           |
| ---------------------- | ------ | ------------------------------- |
| Después de compilación | 2s     | Python libere handles           |
| Después de GC          | 2s     | Windows procese liberación      |
| Antes de Electron      | 3s     | Seguridad adicional             |
| **Total**              | **7s** | Pequeño overhead, build exitoso |

## ✅ Resultado Esperado

```
[OK] Scripts Python compilados a .pyc
[OK] Archivos liberados
[OK] Python embebido listo: 150 archivos
✓ packaging platform=win32 arch=x64
✓ Build completado exitosamente
```

## 🚀 Próximo Build

El próximo push debería funcionar sin errores EBUSY:

```bash
git add .
git commit -m "fix: resolver EBUSY en Windows build con esperas y GC"
git push origin main
```

## 🔗 Referencias

- [Windows File Locking](https://docs.microsoft.com/en-us/windows/win32/fileio/file-locking)
- [Python Garbage Collection](https://docs.python.org/3/library/gc.html)
- [PowerShell Start-Process](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.management/start-process)
- [Electron Builder Issues](https://github.com/electron-userland/electron-builder/issues)
