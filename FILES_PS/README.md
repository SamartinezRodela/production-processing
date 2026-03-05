# 📜 Scripts PowerShell - Windows

Scripts de automatización para desarrollo y producción en Windows.

---

## 🚀 Scripts de Desarrollo

### start-dev.ps1

Inicia el entorno de desarrollo completo.

**Uso:**

```powershell
.\start-dev.ps1
```

**Qué hace:**

- Inicia el backend (NestJS)
- Inicia el frontend (React + Vite)
- Inicia Electron en modo desarrollo
- Abre consolas separadas para cada proceso

---

## 🔨 Scripts de Compilación

### build-all.ps1

Build completo del proyecto para producción.

**Uso:**

```powershell
.\build-all.ps1
```

**Qué hace:**

- Compila el backend
- Compila el frontend
- Copia archivos a carpetas de producción
- Prepara Python embebido
- Genera ejecutable de Electron

---

### compilar-test-exe.ps1

Compila scripts Python a ejecutables .exe.

**Uso:**

```powershell
.\compilar-test-exe.ps1
```

**Qué hace:**

- Verifica PyInstaller
- Compila `test_exe_source.py` a `test_exe.exe`
- Copia el .exe a `nest-files-py-embedded/executables/`
- Limpia archivos temporales

**Opciones:**

- `--noupx` - Sin compresión (reduce detección de antivirus)
- `--onefile` - Un solo archivo ejecutable
- `--clean` - Limpia cache antes de compilar

**Personalizar:**

```powershell
# Editar el script para compilar otros archivos
python -m PyInstaller --onefile --noupx tu_script.py
```

---

## 📦 Scripts de Empaquetado

### package-app.ps1

Empaqueta la aplicación para distribución.

**Uso:**

```powershell
.\package-app.ps1
```

**Qué hace:**

- Crea instalador .exe para Windows
- Genera archivos .blockmap
- Crea versión portable
- Firma digitalmente (si hay certificado)

**Salida:**

```
nest-electron/release/
├── Production Processing Setup 1.0.0.exe
├── Production Processing Setup 1.0.0.exe.blockmap
└── win-unpacked/
```

---

### create-mac-package.ps1

Crea paquete para Mac desde Windows (cross-platform).

**Uso:**

```powershell
.\create-mac-package.ps1
```

**Qué hace:**

- Prepara Python embebido para Mac
- Configura estructura de carpetas
- Genera paquete .app
- Crea instalador .dmg

**Requisitos:**

- Node.js con soporte cross-platform
- electron-builder configurado

---

## 🛡️ Scripts de Utilidades

### agregar-exclusion-antivirus.ps1

Agrega exclusión en Windows Defender para evitar falsos positivos.

**Uso:**

```powershell
# Ejecutar como Administrador
.\agregar-exclusion-antivirus.ps1
```

**Qué hace:**

- Agrega carpeta `executables/` a exclusiones
- Muestra exclusiones actuales
- Previene detección de .exe compilados

**Importante:**

- ⚠️ Requiere permisos de Administrador
- ✅ Solo afecta a Windows Defender
- 📝 Para otros antivirus, agregar manualmente

---

## 📋 Guía de Uso Rápido

### Desarrollo Diario

```powershell
# Iniciar desarrollo
.\start-dev.ps1
```

### Compilar Python a .exe

```powershell
# Compilar script de prueba
.\compilar-test-exe.ps1

# Agregar exclusión si antivirus bloquea
.\agregar-exclusion-antivirus.ps1
```

### Build de Producción

```powershell
# Build completo
.\build-all.ps1

# Empaquetar para Windows
.\package-app.ps1

# Empaquetar para Mac (desde Windows)
.\create-mac-package.ps1
```

---

## 🔧 Personalización

### Modificar Scripts

Todos los scripts están comentados y pueden ser personalizados:

```powershell
# Ejemplo: Cambiar puerto del backend
# Editar start-dev.ps1
$env:PORT = 3001  # Cambiar de 3000 a 3001
```

### Agregar Nuevos Scripts

1. Crear archivo `.ps1` en esta carpeta
2. Agregar comentarios descriptivos
3. Documentar en este README
4. Actualizar `GUIAS/GUIA-SCRIPTS.md`

---

## ⚠️ Requisitos

### Software Necesario

- **PowerShell 5.1+** (incluido en Windows 10/11)
- **Node.js 18+**
- **Python 3.13** (para compilar .exe)
- **PyInstaller** (para compilar .exe)

### Permisos

Algunos scripts requieren permisos de Administrador:

- `agregar-exclusion-antivirus.ps1` ⚠️ Administrador

---

## 🐛 Solución de Problemas

### "No se puede ejecutar scripts en este sistema"

**Error:**

```
No se puede cargar el archivo porque la ejecución de scripts está deshabilitada
```

**Solución:**

```powershell
# Ejecutar como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### "PyInstaller no encontrado"

**Error:**

```
PyInstaller no está instalado
```

**Solución:**

```powershell
pip install pyinstaller
```

---

### "Acceso denegado"

**Error:**

```
Add-MpPreference : Acceso denegado
```

**Solución:**

- Click derecho en el script
- Seleccionar "Ejecutar como Administrador"

---

## 📚 Documentación Relacionada

- **Guía completa de scripts:** `../GUIAS/GUIA-SCRIPTS.md`
- **Ejecutar .py y .exe:** `../GUIAS/GUIA-EJECUTAR-PY-Y-EXE.md`
- **Firmar ejecutables:** `../GUIAS/GUIA-FIRMAR-EJECUTABLES.md`
- **Producción Electron:** `../GUIAS/GUIA-PRODUCCION-ELECTRON.md`

---

## 🔗 Scripts Relacionados

### Scripts Shell (Mac/Linux)

Ver carpeta `../FILES SH/` para equivalentes en Bash.

---

**Última actualización:** Marzo 2026  
**Total de scripts:** 6 archivos PowerShell
