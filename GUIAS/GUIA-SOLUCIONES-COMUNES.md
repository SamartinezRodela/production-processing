# Guía: Soluciones a Problemas Comunes

Soluciones rápidas a errores frecuentes en el proyecto.

---

## 🐛 Errores de Python

### Bad Magic Number in .pyc

**Error**: `RuntimeError: Bad magic number in .pyc file`

**Causa**: Incompatibilidad de versiones de Python (compilado con 3.12, ejecutado con 3.13).

**Solución**:

```powershell
# Usar Python embebido para compilar
$pythonExe = "nest-files-py-embedded\python.exe"
& $pythonExe compile-python-scripts.py
```

---

### Archivos .py Duplicados

**Problema**: Aparecen tanto `.py` como `.pyc` en producción.

**Solución**: Actualizar filtros en `nest-electron/package.json`:

```json
{
  "filter": ["**/*", "!get-pip.py", "!*.py", "!**/__pycache__/**"]
}
```

---

### Encoding UTF-8

**Error**: `UnicodeEncodeError: 'charmap' codec can't encode character`

**Solución**: Configurar UTF-8 en scripts Python:

```python
import sys
import io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
```

---

## 🔧 Errores de Frontend

### Settings Undefined

**Error**: `Cannot read properties of undefined (reading 'includes')`

**Causa**: `settings` o `defaultSettings` no existen en la base de datos.

**Solución**: Validar antes de usar:

```typescript
isDefaultBasePath(): boolean {
  const path = this.basePath();
  return path ? (path.includes('\\Production\\') || path.includes('/Production/')) : false;
}
```

---

### Error Contains Null

**Error**: `TypeError: Cannot read property 'contains' of null`

**Causa**: Elemento DOM no existe cuando se intenta acceder.

**Solución**: Verificar existencia:

```typescript
const element = document.querySelector(".my-element");
if (element) {
  // Usar element
}
```

---

### Espacio Blanco Sobrante

**Problema**: Espacios blancos no deseados en el layout.

**Solución**: Verificar CSS:

```css
.container {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

---

## 🗄️ Errores de Base de Datos

### Database No Se Actualiza

**Problema**: Cambios no se guardan en `database.json`.

**Diagnóstico**:

```javascript
// En DevTools
fetch("http://localhost:3000/settings/database-info")
  .then((r) => r.json())
  .then((data) => console.log(data));
```

**Solución**: Verificar permisos de escritura:

```powershell
# Windows
icacls "$env:APPDATA\Production Processing" /grant %USERNAME%:F /T
```

---

## 🔐 Errores de Permisos

### Permisos Mac

**Error**: `EACCES: permission denied`

**Solución**:

```bash
# Dar permisos de ejecución
chmod +x script.sh

# Dar permisos a carpeta
chmod 755 ~/Library/Application\ Support/Production\ Processing/
```

---

### Integrity Check Failed

**Error**: `Integrity check failed for file`

**Causa**: Archivo Python fue modificado o corrupto.

**Solución**: Recompilar scripts:

```powershell
python compile-python-scripts.py
```

---

## 📦 Errores de Build

### Python Tests Path Validation

**Error**: Tests de Python fallan por rutas incorrectas.

**Solución**: Usar rutas absolutas:

```python
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, 'archivo.txt')
```

---

## 🎨 Errores de UI

### Archivo Abre Nueva Pestaña

**Problema**: Al soltar archivo, se abre en nueva pestaña.

**Solución**: Prevenir comportamiento por defecto:

```typescript
window.addEventListener(
  "dragover",
  (e: DragEvent) => {
    e.preventDefault();
  },
  false,
);

window.addEventListener(
  "drop",
  (e: DragEvent) => {
    e.preventDefault();
  },
  false,
);
```

---

### Animación Trabada

**Problema**: Animaciones de drag & drop no desaparecen.

**Solución**: Múltiples capas de protección:

```typescript
// Listener global de dragend
window.addEventListener(
  "dragend",
  () => {
    this.isDragging.set(false);
  },
  false,
);

// Watchdog timer
this.dragWatchdogTimeout = setTimeout(() => {
  if (this.isDragging()) {
    this.isDragging.set(false);
  }
}, 5000);
```

---

## 🔍 Diagnóstico General

### Verificar Logs del Backend

**Windows**:

```powershell
Get-Content "$env:APPDATA\Production Processing\logs\main.log" -Wait -Tail 50
```

**Mac**:

```bash
tail -f ~/Library/Logs/Production\ Processing/backend.log
```

---

### Verificar Rutas de Producción

```javascript
// En DevTools
fetch("http://localhost:3000/python/debug-paths")
  .then((r) => r.json())
  .then((data) => console.log(data));
```

---

### Limpiar Caché

**Navegador**:

```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

**Node Modules**:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 🚀 Comandos Útiles

### Reinstalar Dependencias

```powershell
# Backend
cd nest-ui-be
Remove-Item -Recurse -Force node_modules
npm install

# Frontend
cd nest-ui-fe
Remove-Item -Recurse -Force node_modules
npm install

# Electron
cd nest-electron
Remove-Item -Recurse -Force node_modules
npm install
```

---

### Recompilar Todo

```powershell
# Backend
cd nest-ui-be
npm run build

# Frontend
cd nest-ui-fe
npm run build

# Electron
cd nest-electron
npm run build
```

---

### Limpiar Builds

```powershell
# Limpiar todo
Remove-Item -Recurse -Force nest-ui-be/dist
Remove-Item -Recurse -Force nest-ui-fe/dist
Remove-Item -Recurse -Force nest-electron/dist
Remove-Item -Recurse -Force nest-electron/release
```

---

## 📝 Checklist de Troubleshooting

Cuando algo no funciona:

- [ ] Verificar que todos los servicios estén corriendo
- [ ] Limpiar caché del navegador
- [ ] Verificar logs del backend
- [ ] Verificar consola del navegador (F12)
- [ ] Reinstalar node_modules si es necesario
- [ ] Recompilar si cambiaste TypeScript
- [ ] Verificar permisos de archivos
- [ ] Verificar rutas de producción vs desarrollo

---

**Fecha**: Marzo 2026  
**Versión**: 1.0.0
