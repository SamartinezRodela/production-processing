# Guía: Diagnosticar Problemas en Producción

## Error 500 en endpoints Python

Si recibes un error 500 al llamar endpoints como `/python/saludar`, sigue estos pasos:

### 1. Verificar estructura de archivos

La app empaquetada debe tener esta estructura:

```
Production Processing.exe (o .app en Mac)
└── resources/
    ├── app.asar
    ├── backend/
    │   ├── dist/
    │   ├── node_modules/
    │   └── package.json
    ├── frontend/
    │   └── (archivos Angular)
    └── python/
        ├── python.exe (Windows) o python-runtime/ (Mac)
        ├── saludar.py
        ├── generar_pdf.py
        ├── generar_pdf_path.py
        ├── test_imports.py
        └── executables/
```

### 2. Verificar logs del backend

**En desarrollo:**

```bash
cd nest-ui-be
npm run start:dev
```

**En producción (Windows portable):**

1. Abre la app
2. Presiona `Ctrl + Shift + I` para abrir DevTools
3. Ve a la pestaña "Console"
4. Busca errores relacionados con Python

### 3. Probar endpoint de debug

Abre en el navegador:

```
http://localhost:3000/python/debug-paths
```

Debe mostrar:

```json
{
  "scriptsPath": "C:\\...\\resources\\python",
  "executablesPath": "C:\\...\\resources\\python\\executables",
  "pythonExecutable": "C:\\...\\resources\\python\\python.exe",
  "resourcesPath": "C:\\...\\resources",
  "isProduction": true
}
```

### 4. Errores comunes

#### Error: "Python embebido no encontrado"

**Causa:** La carpeta `python` no se copió al empaquetar

**Solución:**

1. Verifica que `nest-files-py-embedded/` existe antes de compilar
2. Revisa `nest-electron/package.json` → `build.extraResources`
3. Recompila con GitHub Actions

#### Error: "Script no encontrado"

**Causa:** Los scripts `.py` no se copiaron a la carpeta embebida

**Solución:**

1. Verifica que `nest-files-py/*.py` existen
2. El workflow debe copiar los scripts:
   ```powershell
   Copy-Item -Path "nest-files-py\*.py" -Destination "nest-files-py-embedded\" -Force
   ```
3. Recompila con GitHub Actions

#### Error: "No module named 'reportlab'"

**Causa:** Las dependencias Python no se instalaron

**Solución:**

1. Verifica que el workflow instala reportlab:
   ```powershell
   .\python.exe -m pip install reportlab
   ```
2. Verifica que `python313._pth` tiene `import site` descomentado
3. Recompila con GitHub Actions

### 5. Verificar instalación de reportlab

**En desarrollo:**

```bash
cd nest-files-py-embedded
.\python.exe -m pip list
```

Debe mostrar:

```
reportlab    x.x.x
pillow       x.x.x
```

**En producción:**
Abre PowerShell en la carpeta de la app:

```powershell
cd "C:\...\Production Processing\resources\python"
.\python.exe -m pip list
```

### 6. Probar Python directamente

**En desarrollo:**

```bash
cd nest-files-py-embedded
.\python.exe saludar.py "Juan"
```

Debe retornar:

```json
{ "success": true, "mensaje": "!Hola Juan! Bienvenido", "timestamp": "..." }
```

**En producción:**

```powershell
cd "C:\...\Production Processing\resources\python"
.\python.exe saludar.py "Juan"
```

### 7. Checklist antes de distribuir

- [ ] `nest-files-py-embedded/` existe y contiene Python
- [ ] Scripts `.py` están en `nest-files-py-embedded/`
- [ ] `reportlab` está instalado en Python embebido
- [ ] `python313._pth` tiene `import site` descomentado
- [ ] Carpeta `executables/` existe
- [ ] Backend compilado (`nest-ui-be/dist/`)
- [ ] Frontend compilado (`nest-ui-fe/dist/`)
- [ ] Electron compilado (`nest-electron/dist/`)

### 8. Recompilar correctamente

**Opción 1: GitHub Actions (RECOMENDADO)**

```bash
git add .
git commit -m "Fix: Agregar scripts Python al build"
git push
```

Espera a que el workflow termine y descarga el artefacto.

**Opción 2: Local (solo si tienes permisos admin)**

```powershell
# 1. Limpiar
cd nest-electron
Remove-Item -Recurse -Force release

# 2. Compilar todo
cd ../nest-ui-be
npm run build

cd ../nest-ui-fe
npm run build

cd ../nest-electron
npm run dist:win
```

### 9. Validar el build

Después de compilar, verifica:

```powershell
# Verificar que Python existe
Test-Path "nest-electron\release\win-unpacked\resources\python\python.exe"

# Verificar que scripts existen
Test-Path "nest-electron\release\win-unpacked\resources\python\saludar.py"

# Verificar que backend existe
Test-Path "nest-electron\release\win-unpacked\resources\backend\dist"

# Verificar que frontend existe
Test-Path "nest-electron\release\win-unpacked\resources\frontend"
```

Todos deben retornar `True`.

## Solución rápida

Si el error persiste, el problema más común es que **los scripts Python no se copiaron**.

Actualiza `.github/workflows/build-windows.yml` para incluir:

```yaml
- name: Setup Python Embedded
  run: |
    # ... (descargar e instalar Python)

    # IMPORTANTE: Copiar scripts
    if (Test-Path "nest-files-py") {
      Copy-Item -Path "nest-files-py\*.py" -Destination "nest-files-py-embedded\" -Force
    }

    # Crear carpeta executables
    New-Item -ItemType Directory -Path "nest-files-py-embedded\executables" -Force
```

Luego recompila con GitHub Actions.
