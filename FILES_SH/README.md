# 🐚 Scripts Shell - Mac/Linux

Scripts de automatización para desarrollo y producción en macOS y Linux.

---

## 🚀 Scripts de Configuración

### setup-mac.sh

Configuración inicial del proyecto en Mac.

**Uso:**

```bash
chmod +x setup-mac.sh
./setup-mac.sh
```

**Qué hace:**

- Instala dependencias del proyecto
- Configura Node.js y npm
- Prepara Python embebido para Mac
- Configura permisos necesarios
- Inicializa base de datos

**Primera vez:**

```bash
# Dar permisos de ejecución a todos los scripts
chmod +x *.sh
```

---

### prepare-python-mac.sh

Prepara Python embebido para macOS.

**Uso:**

```bash
./prepare-python-mac.sh
```

**Qué hace:**

- Descarga Python standalone para Mac
- Extrae y configura Python runtime
- Instala dependencias (reportlab, etc.)
- Copia scripts Python
- Configura permisos de ejecución

**Estructura creada:**

```
nest-files-py-embedded-mac/
├── python-runtime/
│   ├── bin/
│   │   └── python3
│   └── lib/
└── [scripts .py]
```

---

## 🔨 Scripts de Compilación

### build-mac.sh

Build completo del proyecto para macOS.

**Uso:**

```bash
./build-mac.sh
```

**Qué hace:**

- Compila el backend (NestJS)
- Compila el frontend (React + Vite)
- Prepara Python embebido
- Copia recursos necesarios
- Genera aplicación .app
- Crea bundle de Electron

**Salida:**

```
nest-electron/release/
└── mac/
    └── Production Processing.app
```

---

## 📦 Scripts de Empaquetado

### create-dmg.sh

Crea instalador DMG completo para macOS.

**Uso:**

```bash
./create-dmg.sh
```

**Qué hace:**

- Crea imagen de disco (.dmg)
- Configura ventana de instalación
- Agrega icono personalizado
- Crea enlace a Applications
- Configura fondo y layout
- Firma digitalmente (si hay certificado)

**Salida:**

```
nest-electron/release/
└── Production Processing-1.0.0.dmg
```

**Personalización:**

```bash
# Editar variables en el script
APP_NAME="Production Processing"
VERSION="1.0.0"
BACKGROUND_IMAGE="background.png"
```

---

### create-dmg-simple.sh

Crea instalador DMG simple (sin personalización).

**Uso:**

```bash
./create-dmg-simple.sh
```

**Qué hace:**

- Crea DMG básico rápidamente
- Sin personalización visual
- Ideal para testing

**Ventajas:**

- ✅ Más rápido
- ✅ Menos dependencias
- ✅ Ideal para desarrollo

**Desventajas:**

- ❌ Sin personalización
- ❌ Apariencia básica

---

## 📋 Guía de Uso Rápido

### Primera Configuración

```bash
# 1. Dar permisos
chmod +x *.sh

# 2. Setup inicial
./setup-mac.sh

# 3. Preparar Python
./prepare-python-mac.sh
```

### Desarrollo Diario

```bash
# Iniciar desarrollo (desde raíz del proyecto)
npm run dev
```

### Build de Producción

```bash
# Build completo
./build-mac.sh

# Crear instalador DMG
./create-dmg.sh

# O versión simple para testing
./create-dmg-simple.sh
```

---

## 🔧 Requisitos

### Software Necesario

- **macOS 10.15+** (Catalina o superior)
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```
- **Node.js 18+**
  ```bash
  brew install node
  ```
- **Homebrew** (recomendado)
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```

### Herramientas Opcionales

- **create-dmg** (para DMG personalizados)
  ```bash
  npm install -g create-dmg
  ```

---

## 🔐 Permisos y Firma

### Dar Permisos de Ejecución

```bash
# Un script específico
chmod +x setup-mac.sh

# Todos los scripts
chmod +x *.sh

# Verificar permisos
ls -la *.sh
```

### Firma de Código (Producción)

Para distribuir en Mac App Store o evitar advertencias de Gatekeeper:

```bash
# Firmar aplicación
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Tu Nombre" \
  "Production Processing.app"

# Verificar firma
codesign --verify --deep --strict --verbose=2 \
  "Production Processing.app"

# Notarizar con Apple
xcrun notarytool submit "Production Processing.dmg" \
  --apple-id "tu@email.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID"
```

---

## 🐛 Solución de Problemas

### "Permission denied"

**Error:**

```bash
bash: ./setup-mac.sh: Permission denied
```

**Solución:**

```bash
chmod +x setup-mac.sh
./setup-mac.sh
```

---

### "Python not found"

**Error:**

```
python3: command not found
```

**Solución:**

```bash
# Instalar Python con Homebrew
brew install python@3.13

# O descargar de python.org
```

---

### "create-dmg not found"

**Error:**

```
create-dmg: command not found
```

**Solución:**

```bash
# Opción 1: npm
npm install -g create-dmg

# Opción 2: Homebrew
brew install create-dmg
```

---

### "App dañada" al abrir

**Error:**

```
"Production Processing.app" está dañada y no se puede abrir
```

**Solución:**

```bash
# Remover atributo de cuarentena
xattr -cr "Production Processing.app"

# O permitir apps de desarrolladores no identificados
sudo spctl --master-disable
```

---

## 🔄 Equivalentes PowerShell

| Script Shell            | Equivalente PowerShell | Descripción      |
| ----------------------- | ---------------------- | ---------------- |
| `setup-mac.sh`          | `start-dev.ps1`        | Setup inicial    |
| `build-mac.sh`          | `build-all.ps1`        | Build completo   |
| `create-dmg.sh`         | `package-app.ps1`      | Crear instalador |
| `prepare-python-mac.sh` | (incluido en build)    | Python embebido  |

---

## 📚 Documentación Relacionada

- **Guía desarrollo Mac:** `../GUIAS/GUIA-DESARROLLO-MAC.md`
- **Python embebido Mac:** `../GUIAS/GUIA-PYTHON-EMBEBIDO-MAC.md`
- **Cross-platform build:** `../GUIAS/GUIA-COMPILAR-EN-WINDOWS-INSTALAR-EN-MAC.md`
- **Producción Electron:** `../GUIAS/GUIA-PRODUCCION-ELECTRON.md`

---

## 💡 Tips y Trucos

### Ejecutar en Background

```bash
# Ejecutar script en background
./build-mac.sh &

# Ver procesos en background
jobs

# Traer al foreground
fg %1
```

### Logs y Debug

```bash
# Guardar output en archivo
./build-mac.sh > build.log 2>&1

# Ver logs en tiempo real
tail -f build.log
```

### Automatización

```bash
# Crear alias en ~/.zshrc o ~/.bashrc
alias build-prod="cd /path/to/project && ./FILES\ SH/build-mac.sh"

# Usar
build-prod
```

---

## 🔗 Scripts Relacionados

### Scripts PowerShell (Windows)

Ver carpeta `../FILES PS/` para equivalentes en Windows.

---

**Última actualización:** Marzo 2026  
**Total de scripts:** 5 archivos Shell  
**Compatibilidad:** macOS 10.15+, Linux (con ajustes)
