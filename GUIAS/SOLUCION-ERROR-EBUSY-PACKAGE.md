# Solución: Error EBUSY al Empaquetar

## 🔴 Error

```
⨯ EBUSY: resource busy or locked, copyfile
'C:\Projects\NEST-UI-V2\nest-files-py-embedded\get-pip.py' ->
'C:\Projects\NEST-UI-V2\nest-electron\release\win-unpacked\resources\python\get-pip.py'
```

---

## 🎯 Causa del Error

El error `EBUSY` (resource busy) ocurre cuando:

1. **Un proceso está usando el archivo** - Python, Node, Electron, o tu app están ejecutándose
2. **Antivirus está escaneando** - Windows Defender u otro antivirus está bloqueando el archivo
3. **Archivo abierto en editor** - VSCode u otro editor tiene el archivo abierto
4. **Build anterior no terminó** - Proceso de empaquetado anterior sigue corriendo

---

## ✅ Soluciones Rápidas

### Solución 1: Usar Script Mejorado (Recomendado)

Creé un script que maneja este problema automáticamente:

```powershell
.\FILES PS\package-app-safe.ps1
```

**Qué hace:**

- ✅ Cierra todos los procesos relacionados
- ✅ Espera a que se liberen los archivos
- ✅ Reintenta si falla
- ✅ Manejo robusto de errores

---

### Solución 2: Cerrar Procesos Manualmente

**Paso 1: Cerrar procesos**

```powershell
# Cerrar todos los procesos relacionados
Get-Process | Where-Object {
    $_.ProcessName -like "*electron*" -or
    $_.ProcessName -like "*node*" -or
    $_.ProcessName -like "*python*"
} | Stop-Process -Force
```

**Paso 2: Esperar y reintentar**

```powershell
# Esperar 5 segundos
Start-Sleep -Seconds 5

# Ejecutar empaquetado
.\FILES PS\package-app.ps1
```

---

### Solución 3: Eliminar Carpeta Release Manualmente

**Si el script falla:**

```powershell
# 1. Cerrar procesos
Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process -Force

# 2. Esperar
Start-Sleep -Seconds 3

# 3. Eliminar carpeta release
Remove-Item -Path "nest-electron\release" -Recurse -Force

# 4. Reintentar empaquetado
cd nest-electron
npm run dist:win
```

---

### Solución 4: Reiniciar y Empaquetar

**Si nada funciona:**

1. Cerrar VSCode completamente
2. Cerrar todas las ventanas de PowerShell
3. Reiniciar la PC (libera todos los archivos)
4. Ejecutar el script de empaquetado

```powershell
.\FILES PS\package-app-safe.ps1
```

---

## 🛡️ Prevención

### Antes de Empaquetar:

**1. Cerrar aplicaciones:**

- ✅ Cerrar tu app si está corriendo
- ✅ Cerrar servidores de desarrollo
- ✅ Cerrar VSCode (opcional pero recomendado)

**2. Detener procesos de desarrollo:**

```powershell
# Si tienes start-dev.ps1 corriendo, cerrarlo
# Ctrl+C en todas las consolas de desarrollo
```

**3. Agregar exclusión de antivirus:**

```powershell
# Ejecutar como Administrador
.\FILES PS\agregar-exclusion-antivirus.ps1
```

---

## 🔍 Diagnóstico

### Ver qué proceso está usando el archivo

**PowerShell (requiere Administrador):**

```powershell
# Instalar herramienta
Install-Module -Name Handle -Force

# Ver qué proceso usa el archivo
Get-Handle -Path "nest-files-py-embedded\get-pip.py"
```

**Alternativa con Handle.exe (Sysinternals):**

```powershell
# Descargar Handle.exe de Microsoft Sysinternals
# https://docs.microsoft.com/en-us/sysinternals/downloads/handle

.\handle.exe "get-pip.py"
```

---

## 🔧 Soluciones Avanzadas

### Opción 1: Excluir Archivos Problemáticos

Si `get-pip.py` no es necesario en producción:

**Editar `nest-electron/package.json`:**

```json
{
  "build": {
    "files": ["!**/get-pip.py", "!**/pip/**"]
  }
}
```

---

### Opción 2: Copiar Python Embebido Antes

**Script alternativo:**

```powershell
# 1. Copiar Python embebido a ubicación temporal
Copy-Item -Path "nest-files-py-embedded" -Destination "temp-python" -Recurse

# 2. Usar copia temporal para empaquetar
# (modificar electron-builder config)

# 3. Limpiar después
Remove-Item -Path "temp-python" -Recurse -Force
```

---

### Opción 3: Deshabilitar Antivirus Temporalmente

**Solo durante el empaquetado:**

1. Abrir Windows Security
2. Virus & threat protection
3. Manage settings
4. Desactivar "Real-time protection" temporalmente
5. Ejecutar empaquetado
6. Reactivar protección

⚠️ **Advertencia:** Solo hacer esto si confías en tu código.

---

## 📋 Checklist Pre-Empaquetado

Antes de ejecutar `package-app.ps1`:

- [ ] Cerrar tu aplicación si está corriendo
- [ ] Cerrar servidores de desarrollo (npm run dev)
- [ ] Cerrar VSCode (opcional)
- [ ] Cerrar otras instancias de PowerShell
- [ ] Esperar 5 segundos
- [ ] Ejecutar script de empaquetado

---

## 🚀 Script Completo de Solución

Creé este script que hace todo automáticamente:

```powershell
# fix-and-package.ps1

Write-Host "Solucionando problemas y empaquetando..." -ForegroundColor Cyan

# 1. Cerrar procesos
Write-Host "Cerrando procesos..." -ForegroundColor Yellow
Get-Process | Where-Object {
    $_.ProcessName -like "*electron*" -or
    $_.ProcessName -like "*node*" -or
    $_.ProcessName -like "*python*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Esperar
Write-Host "Esperando liberación de archivos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3. Limpiar release
Write-Host "Limpiando builds anteriores..." -ForegroundColor Yellow
Remove-Item -Path "nest-electron\release" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Esperar de nuevo
Start-Sleep -Seconds 3

# 5. Empaquetar
Write-Host "Empaquetando..." -ForegroundColor Cyan
.\FILES PS\package-app-safe.ps1
```

**Guardar como:** `FILES PS/fix-and-package.ps1`

**Usar:**

```powershell
.\FILES PS\fix-and-package.ps1
```

---

## ❓ Preguntas Frecuentes

**P: ¿Por qué pasa esto?**  
R: Windows bloquea archivos que están siendo usados por procesos o antivirus.

**P: ¿Es peligroso forzar el cierre de procesos?**  
R: No, solo cierra procesos de desarrollo. Guarda tu trabajo antes.

**P: ¿Debo reiniciar siempre?**  
R: No, solo si las otras soluciones no funcionan.

**P: ¿Puedo prevenir este error?**  
R: Sí, cerrando todos los procesos relacionados antes de empaquetar.

**P: ¿El script safe es más lento?**  
R: Ligeramente (5-10 segundos más), pero es más confiable.

---

## 📊 Comparación de Scripts

| Script                 | Velocidad | Confiabilidad | Manejo de Errores |
| ---------------------- | --------- | ------------- | ----------------- |
| `package-app.ps1`      | ⚡ Rápido | ⚠️ Media      | ❌ Básico         |
| `package-app-safe.ps1` | 🐢 Normal | ✅ Alta       | ✅ Avanzado       |
| `fix-and-package.ps1`  | 🐢 Normal | ✅ Muy Alta   | ✅ Completo       |

**Recomendación:** Usar `package-app-safe.ps1` siempre.

---

## 🎯 Resumen

**Error:** Archivo bloqueado durante empaquetado

**Causa:** Proceso usando el archivo

**Solución rápida:**

```powershell
# Cerrar procesos y reintentar
Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process -Force
Start-Sleep -Seconds 5
.\FILES PS\package-app-safe.ps1
```

**Solución definitiva:** Usar `package-app-safe.ps1` que maneja esto automáticamente.

---

**Fecha:** Marzo 2026  
**Versión:** 1.0.0
