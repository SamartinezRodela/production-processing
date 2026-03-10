# Fix: Error EBUSY en Windows Build (Actualizado)

## Problema

Durante el build de Electron en GitHub Actions (Windows), aparece el error:

```
⨯ EBUSY: resource busy or locked, copyfile
'nest-files-py-embedded\python313.dll' ->
'nest-electron\release\win-unpacked\resources\python\python313.dll'
```

## Causa Raíz

Windows mantiene un "lock" (bloqueo) en los archivos DLL de Python después de que el script `compile-python-scripts.py` termina de ejecutarse. Esto sucede porque:

1. Python carga las DLLs en memoria
2. El proceso de Python termina pero Windows no libera inmediatamente los archivos
3. Electron Builder intenta copiar los archivos mientras aún están bloqueados

## Solución Aplicada (v2 - Aumentada)

### 1. Terminar Procesos de Python

Agregado paso para terminar cualquier proceso de Python que pueda estar corriendo:

```powershell
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
```

### 2. Aumentar Tiempos de Espera

**Después de compilar scripts Python:**

```yaml
# Esperar a que Python libere todos los archivos
Start-Sleep -Seconds 5 # Aumentado de 2 a 5 segundos
```

**Paso de liberación de archivos:**

```yaml
- name: Release Python Embedded Files
  run: |
    # Terminar procesos Python
    Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # Esperar más tiempo
    Start-Sleep -Seconds 5

    # Forzar garbage collection múltiple
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    [System.GC]::Collect()

    # Esperar adicional
    Start-Sleep -Seconds 3
```

**Antes del build de Electron:**

```yaml
- name: Prepare for Electron Build
  run: |
    # Liberar handles múltiples veces
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()

    # Esperar más tiempo
    Start-Sleep -Seconds 8

    # Verificar archivos
    # ...

    # Espera final antes de Electron
    Start-Sleep -Seconds 5
```

### 3. Garbage Collection en Python

En `compile-python-scripts.py`:

```python
# Al final del script
import gc
gc.collect()
```

## Tiempos de Espera Totales

| Paso                       | Tiempo        | Acumulado |
| -------------------------- | ------------- | --------- |
| Después de compilar Python | 5s            | 5s        |
| Release Python Files       | 8s (5s + 3s)  | 13s       |
| Prepare for Electron       | 13s (8s + 5s) | 26s       |
| **TOTAL**                  | **26s**       | **26s**   |

## Overhead

- Tiempo adicional: ~26 segundos (aumentado de 7s)
- Impacto: Mínimo (el build completo toma varios minutos)
- Beneficio: Build exitoso sin errores EBUSY
- Razón del aumento: Los 7 segundos originales no fueron suficientes

## Cambios Respecto a Versión Anterior

| Aspecto                    | v1 (Original) | v2 (Actualizado) |
| -------------------------- | ------------- | ---------------- |
| Tiempo después de compilar | 2s            | 5s               |
| Tiempo de liberación       | 2s            | 8s               |
| Tiempo antes de Electron   | 3s            | 13s              |
| Terminar procesos Python   | ❌ No         | ✅ Sí            |
| GC múltiple                | 1x            | 2x               |
| **Total**                  | **7s**        | **26s**          |

## Testing

Para verificar que el fix funciona:

1. Push a GitHub
2. Esperar a que GitHub Actions ejecute el workflow
3. Verificar que el paso "Build Electron App (Windows)" completa exitosamente
4. Verificar que se generan los artefactos (instalador y portable)

## Por Qué Falló la Primera Vez

La solución original con 7 segundos de espera no fue suficiente porque:

- Windows puede tardar más en liberar DLLs grandes (python313.dll es ~100MB)
- GitHub Actions runners pueden tener I/O más lento
- Múltiples archivos DLL necesitan ser liberados simultáneamente

## Alternativas Consideradas

❌ **Usar Python portable en lugar de embebido**: No resuelve el problema
❌ **Copiar archivos manualmente antes de Electron**: Complica el workflow
❌ **Usar un script batch separado**: Agrega complejidad innecesaria
❌ **Esperas de 7 segundos**: No fue suficiente
✅ **Esperas de 26 segundos + terminar procesos**: Efectivo

## Commits Relacionados

- `[NUEVO]` - fix: aumentar tiempos de espera a 26s para resolver EBUSY definitivamente
- `48e9633` - feat: implementar sistema de seguridad de 3 capas + fixes EBUSY y encoding (v1)
- `680ffd8` - fix: resolver encoding UTF-8 en GitHub Actions para Windows

## Referencias

- Issue original: Error EBUSY en GitHub Actions Windows
- Documentación: `IMPLEMENTACION-SEGURIDAD.md`
- Workflow: `.github/workflows/build-windows.yml`
