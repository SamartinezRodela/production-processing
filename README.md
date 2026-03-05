# NEST-UI-V2

Sistema de procesamiento de producción con Electron, NestJS, React y Python embebido.

---

## 📁 Estructura del Proyecto

```
NEST-UI-V2/
├── 📂 GUIAS/                    # Documentación y guías del proyecto
├── 📂 FILES PS/                 # Scripts PowerShell (.ps1)
├── 📂 FILES SH/                 # Scripts Shell (.sh) para Mac/Linux
├── 📂 nest-ui-be/              # Backend NestJS
├── 📂 nest-ui-fe/              # Frontend React
├── 📂 nest-files-py/           # Scripts Python (desarrollo)
├── 📂 nest-files-py-embedded/  # Python embebido + scripts (producción)
├── 📂 nest-electron/           # Aplicación Electron
├── 📂 Base_Files/              # Archivos base y templates
└── 📂 Assets/                  # Recursos estáticos
```

---

## 📚 Guías Disponibles

### Configuración y Desarrollo

- `GUIA-ESTRUCTURA-PROYECTO.md` - Estructura completa del proyecto
- `GUIA-DESARROLLO-MAC.md` - Configuración para desarrollo en Mac
- `GUIA-SCRIPTS.md` - Documentación de todos los scripts

### Python y Backend

- `GUIA-EJECUTAR-PY-Y-EXE.md` - Ejecutar scripts .py y ejecutables .exe
- `GUIA-FIRMAR-EJECUTABLES.md` - Firmar ejecutables para evitar antivirus
- `GUIA-PYTHON-EMBEBIDO-SIN-INSTALACION.md` - Python embebido en Windows
- `GUIA-PYTHON-EMBEBIDO-MAC.md` - Python embebido en Mac
- `GUIA-PROTEGER-PYTHON.md` - Proteger código Python
- `GUIA-BASE-DATOS-JSON-BACKEND.md` - Base de datos JSON
- `GUIA-WEBSOCKETS-TIEMPO-REAL.md` - WebSockets en tiempo real
- `GUIA-PUERTO-DINAMICO.md` - Configuración de puertos dinámicos
- `EJEMPLO-GENERAR-PDF.md` - Generar PDFs con Python

### Producción y Deployment

- `GUIA-PRODUCCION-ELECTRON.md` - Empaquetar para producción
- `GUIA-COMPILAR-EN-WINDOWS-INSTALAR-EN-MAC.md` - Cross-platform build
- `GUIA-GITHUB-ACTIONS.md` - CI/CD con GitHub Actions
- `DIAGNOSTICAR-PRODUCCION.md` - Diagnóstico de problemas

### UI y Frontend

- `GUIA-ARREGLAR-DRAG-DROP.md` - Implementación drag & drop
- `ANIMACIONES-AJUSTADAS-AL-CONTENEDOR.md` - Animaciones CSS
- `DETECCION-ARCHIVOS-DUPLICADOS.md` - Detectar duplicados

### Soluciones a Problemas

- `SOLUCION-DRAG-DROP-NO-FUNCIONA.md`
- `SOLUCION-ANIMACION-TRABADA.md`
- `SOLUCION-ERROR-CONTAINS-NULL.md`
- `SOLUCION-ESPACIO-BLANCO-SOBRANTE.md`
- Y más...

---

## 🔧 Scripts PowerShell (Windows)

### Desarrollo

```powershell
.\FILES PS\start-dev.ps1              # Iniciar desarrollo
.\FILES PS\compilar-test-exe.ps1      # Compilar script Python a .exe
```

### Producción

```powershell
.\FILES PS\build-all.ps1              # Build completo
.\FILES PS\package-app.ps1            # Empaquetar aplicación
.\FILES PS\create-mac-package.ps1     # Crear paquete para Mac
```

### Utilidades

```powershell
.\FILES PS\agregar-exclusion-antivirus.ps1  # Agregar exclusión en Windows Defender
```

---

## 🔧 Scripts Shell (Mac/Linux)

### Desarrollo

```bash
./FILES SH/setup-mac.sh               # Configuración inicial en Mac
./FILES SH/prepare-python-mac.sh      # Preparar Python embebido
```

### Producción

```bash
./FILES SH/build-mac.sh               # Build para Mac
./FILES SH/create-dmg.sh              # Crear instalador DMG
./FILES SH/create-dmg-simple.sh       # Crear DMG simple
```

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
# Instalar dependencias del proyecto
npm install

# Backend
cd nest-ui-be
npm install

# Frontend
cd ../nest-ui-fe
npm install
```

### 2. Desarrollo

**Windows:**

```powershell
.\FILES PS\start-dev.ps1
```

**Mac/Linux:**

```bash
./FILES SH/setup-mac.sh
```

### 3. Producción

**Windows:**

```powershell
.\FILES PS\build-all.ps1
```

**Mac:**

```bash
./FILES SH/build-mac.sh
```

---

## 🐍 Python Embebido

### Scripts Python (.py)

Ubicación: `nest-files-py-embedded/`

- `saludar.py` - Script de ejemplo
- `generar_pdf.py` - Generador de PDFs
- `generar_pdf_path.py` - Generador con ruta personalizada
- `test_imports.py` - Test de importaciones

### Ejecutables (.exe)

Ubicación: `nest-files-py-embedded/executables/`

Compilar scripts a ejecutables:

```powershell
.\FILES PS\compilar-test-exe.ps1
```

---

## 📡 API Backend

### Endpoints Python

```typescript
// Ejecutar script .py
POST /python/execute-file
{
  "fileName": "saludar.py",
  "args": ["Juan"]
}

// Ejecutar ejecutable .exe
POST /python/execute-file
{
  "fileName": "procesador.exe",
  "args": ["input.txt"]
}

// Endpoint específico para .exe
POST /python/execute-exe
{
  "exeName": "test.exe",
  "args": ["parametro"]
}

// Debug de rutas
GET /python/debug-paths
```

---

## 🛠️ Tecnologías

- **Frontend:** React + TypeScript + Vite
- **Backend:** NestJS + TypeScript
- **Desktop:** Electron
- **Python:** Python 3.13 embebido
- **Base de datos:** JSON (lowdb)
- **Comunicación:** WebSockets + REST API

---

## 📦 Estructura de Carpetas Detallada

### Backend (nest-ui-be/)

```
nest-ui-be/
├── src/
│   ├── auth/           # Autenticación
│   ├── database/       # Base de datos JSON
│   ├── facilities/     # Gestión de facilities
│   ├── orders/         # Gestión de órdenes
│   ├── pdf/            # Generación de PDFs
│   └── python/         # Ejecución de Python
├── data/               # Datos JSON
└── dist/               # Build de producción
```

### Frontend (nest-ui-fe/)

```
nest-ui-fe/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas
│   ├── services/       # Servicios API
│   └── styles/         # Estilos CSS
└── dist/               # Build de producción
```

### Electron (nest-electron/)

```
nest-electron/
├── src/                # Código fuente Electron
├── dist/               # Build
└── release/            # Instaladores
```

---

## 🔒 Seguridad

### Antivirus y Ejecutables

Si tu antivirus detecta los `.exe` compilados:

1. **Agregar exclusión:**

   ```powershell
   .\FILES PS\agregar-exclusion-antivirus.ps1
   ```

2. **Leer guía completa:**
   Ver `GUIAS/GUIA-FIRMAR-EJECUTABLES.md`

---

## 📝 Notas Importantes

### Python Embebido

- ✅ No requiere instalación de Python
- ✅ Portable y autocontenido
- ✅ Funciona en desarrollo y producción

### Scripts vs Ejecutables

- **`.py`** - Para desarrollo, scripts simples, código editable
- **`.exe`** - Para producción, distribución, código protegido

### Cross-Platform

- Windows: Scripts `.ps1` en `FILES PS/`
- Mac/Linux: Scripts `.sh` en `FILES SH/`

---

## 🐛 Solución de Problemas

### Antivirus bloquea .exe

```powershell
.\FILES PS\agregar-exclusion-antivirus.ps1
```

### Python no encontrado

Ver `GUIAS/GUIA-PYTHON-EMBEBIDO-SIN-INSTALACION.md`

### Drag & Drop no funciona

Ver `GUIAS/GUIA-ARREGLAR-DRAG-DROP.md`

### Más problemas

Revisar carpeta `GUIAS/` para soluciones específicas

---

## 📖 Documentación Adicional

Todas las guías están en la carpeta `GUIAS/` organizadas por tema.

Para más información sobre un tema específico, consulta la guía correspondiente.

---

## 🤝 Contribuir

1. Crear rama para nueva funcionalidad
2. Documentar cambios en `GUIAS/`
3. Actualizar este README si es necesario
4. Crear Pull Request

---

## 📄 Licencia

[Tu licencia aquí]

---

**Última actualización:** Marzo 2026  
**Versión:** 2.0.0
