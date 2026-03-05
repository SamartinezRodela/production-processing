# Guía de Scripts del Proyecto

Esta guía explica qué hace cada script y cuándo usarlo.

---

## 📜 Scripts PowerShell (Windows)

### 1. `start-dev.ps1` - Desarrollo Completo ⭐

**Uso:**

```powershell
.\start-dev.ps1
```

**Qué hace:**

- Verifica dependencias (node_modules)
- Abre 3 ventanas de PowerShell:
  - Backend NestJS (puerto 3000)
  - Frontend Angular (puerto 4200)
  - Electron (ventana de escritorio)

**Cuándo usar:**

- Cuando quieres desarrollar y probar la aplicación completa
- Primera vez que inicias el proyecto
- Desarrollo diario

---

### 2. `build-all.ps1` - Compilar Todo

**Uso:**

```powershell
.\build-all.ps1
```

**Qué hace:**

- Compila Backend (NestJS)
- Compila Frontend (Angular)
- Compila Electron (TypeScript)

**Cuándo usar:**

- Antes de crear el instalador
- Para verificar que todo compila sin errores
- Después de hacer cambios importantes

---

### 3. `package-app.ps1` - Crear Instalador Windows ⭐

**Uso:**

```powershell
.\package-app.ps1
```

**Qué hace:**

- Limpia builds anteriores
- Compila Backend, Frontend y Electron
- Crea el instalador `.exe` para Windows
- Muestra información del instalador (tamaño, ubicación)

**Resultado:**

```
nest-electron/release/Production Processing Setup 1.0.0.exe
```

**Cuándo usar:**

- Cuando quieres crear un instalador para distribuir
- Para probar la aplicación en producción
- Antes de entregar a usuarios finales

---

## 🍎 Scripts Bash (Mac)

### 1. `setup-mac.sh` - Configuración Inicial ⭐

**Uso:**

```bash
chmod +x setup-mac.sh
./setup-mac.sh
```

**Qué hace:**

- Verifica Node.js y Python
- Instala dependencias en todos los proyectos (Frontend, Backend, Electron)
- Instala bibliotecas de Python
- Crea estructura de carpetas
- Da permisos de ejecución a scripts

**Cuándo usar:**

- Primera vez que usas el proyecto en Mac
- Después de clonar el repositorio
- Después de transferir desde Windows

---

### 2. `build-mac.sh` - Crear Instalador Mac ⭐

**Uso:**

```bash
./build-mac.sh
```

**Qué hace:**

- Compila Backend (NestJS)
- Compila Frontend (Angular)
- Compila Electron (TypeScript)
- Crea el instalador `.dmg` para Mac

**Resultado:**

```
nest-electron/release/Production Processing-1.0.0.dmg
```

**Cuándo usar:**

- Cuando quieres crear un instalador para Mac
- Para distribuir a usuarios de Mac
- Desarrollo y testing en Mac

---

### 3. `create-dmg.sh` - Solo Crear DMG

**Uso:**

```bash
./create-dmg.sh
```

**Qué hace:**

- Verifica que los archivos ya estén compilados
- Solo crea el DMG (no compila)
- Instala dependencias de Electron si faltan

**Cuándo usar:**

- Cuando ya compilaste en Windows y solo necesitas el DMG
- Proceso de compilación cruzada (Windows → Mac)
- Para ahorrar tiempo si ya compilaste

---

### 4. `prepare-python-mac.sh` - Python Embebido Mac

**Uso:**

```bash
./prepare-python-mac.sh
```

**Qué hace:**

- Crea entorno virtual de Python (venv)
- Instala todas las bibliotecas necesarias (pypdf, pillow, reportlab, etc.)
- Copia scripts Python desde nest-files-py/

**Cuándo usar:**

- Primera vez que preparas Python embebido en Mac
- Cuando actualizas bibliotecas de Python
- Antes de crear el DMG con Python incluido

---

---

## 🎯 Flujos de Trabajo Comunes

### Desarrollo Diario (Windows)

```powershell
# Iniciar todo
.\start-dev.ps1

# Hacer cambios en el código...

# Cerrar las 3 ventanas cuando termines
```

### Crear Instalador Windows

```powershell
# Opción 1: Todo en uno
.\package-app.ps1

# Opción 2: Paso a paso
.\build-all.ps1
cd nest-electron
npm run dist:win
```

### Crear Instalador Mac (desde Windows)

```powershell
# 1. En Windows: Compilar todo
.\build-all.ps1

# 2. Transferir proyecto a Mac (USB, Git, etc.)

# 3. En Mac: Crear DMG
chmod +x build-mac.sh
./build-mac.sh
```

### Desarrollo en Mac

```bash
# Primera vez
./setup-mac.sh

# Crear instalador
./build-mac.sh
```

---

## 📊 Comparación de Scripts

### Windows

| Script          | Compila | Crea Instalador | Inicia Dev | Tiempo   |
| --------------- | ------- | --------------- | ---------- | -------- |
| start-dev.ps1   | ❌      | ❌              | ✅         | 10 seg   |
| build-all.ps1   | ✅      | ❌              | ❌         | 2-3 min  |
| package-app.ps1 | ✅      | ✅              | ❌         | 5-10 min |

### Mac

| Script                | Compila | Crea DMG | Configura | Tiempo   |
| --------------------- | ------- | -------- | --------- | -------- |
| setup-mac.sh          | ❌      | ❌       | ✅        | 2-3 min  |
| build-mac.sh          | ✅      | ✅       | ❌        | 5-10 min |
| create-dmg.sh         | ❌      | ✅       | ❌        | 2-3 min  |
| prepare-python-mac.sh | ❌      | ❌       | ✅        | 3-5 min  |

---

## 🚨 Errores Comunes

### "No se puede ejecutar scripts"

**Windows:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Mac:**

```bash
chmod +x nombre-script.sh
```

### "npm: command not found"

Instala Node.js:

- **Windows:** https://nodejs.org/
- **Mac:** `brew install node`

### "python: command not found"

Instala Python:

- **Windows:** https://www.python.org/downloads/
- **Mac:** `brew install python@3.11`

---

## 💡 Tips

### Ejecutar en Background (Mac)

```bash
# Ejecutar y continuar usando la terminal
./dev-mac.sh &
```

### Ver Logs en Tiempo Real

```bash
# Mac
tail -f ~/Library/Logs/Production\ Processing/backend.log

# Windows
Get-Content "$env:APPDATA\Production Processing\backend.log" -Wait
```

### Limpiar Todo

```powershell
# Windows
Remove-Item -Recurse -Force nest-ui-be/dist, nest-ui-fe/dist, nest-electron/dist, nest-electron/release

# Mac
rm -rf nest-ui-be/dist nest-ui-fe/dist nest-electron/dist nest-electron/release
```

---

## ✅ Checklist de Scripts

### Antes de Distribuir:

- [ ] Ejecutar `build-all.ps1` sin errores
- [ ] Ejecutar `package-app.ps1` exitosamente
- [ ] Probar instalador en PC limpia
- [ ] Verificar que Python embebido funciona
- [ ] Probar todas las funciones principales

### Para Mac:

- [ ] Transferir proyecto a Mac
- [ ] Ejecutar `setup-mac.sh` (primera vez)
- [ ] Ejecutar `prepare-python-mac.sh`
- [ ] Ejecutar `build-mac.sh`
- [ ] Probar DMG en Mac limpio

---

## 🎯 Resumen Rápido

**Desarrollo:**

- Windows: `.\start-dev.ps1`
- Mac: Usa `build-mac.sh` para compilar y probar

**Instalador:**

- Windows: `.\package-app.ps1`
- Mac: `./build-mac.sh`

**Compilar solo:**

- Windows: `.\build-all.ps1`
- Mac: Incluido en `build-mac.sh`

**Configuración inicial:**

- Windows: Automático con `start-dev.ps1`
- Mac: `./setup-mac.sh`

¡Eso es todo! 🚀
