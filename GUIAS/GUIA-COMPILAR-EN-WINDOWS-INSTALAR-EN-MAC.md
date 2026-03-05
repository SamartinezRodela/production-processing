# ✅ Guía: Compilar en Windows y Crear Instalador en Mac

## 🎯 Concepto

Puedes hacer **casi todo** en Windows y solo usar el Mac para el paso final de crear el DMG.

Esta guía te permite:

- Desarrollar y compilar completamente en Windows
- Transferir solo los archivos necesarios a Mac
- Crear el instalador DMG en Mac en menos de 5 minutos
- Evitar configurar todo el entorno de desarrollo en Mac

---

## 📋 Proceso Completo

### Fase 1: En Windows (Tu PC) 💻

#### Paso 1: Compilar Frontend

```powershell
cd C:\Projects\NEST-UI-V2\nest-ui-fe
npm run build
```

✅ Esto crea: `nest-ui-fe/dist/nest-ui-fe/browser/`

#### Paso 2: Compilar Backend

```powershell
cd ..\nest-ui-be
npm run build
```

✅ Esto crea: `nest-ui-be/dist/`

#### Paso 3: Compilar Electron

```powershell
cd ..\nest-electron
npm run build
```

✅ Esto crea: `nest-electron/dist/`

#### Paso 4: Verificar que todo compiló

```powershell
# Verificar Frontend
dir nest-ui-fe\dist\nest-ui-fe\browser

# Verificar Backend
dir nest-ui-be\dist

# Verificar Electron
dir nest-electron\dist
```

---

### Fase 2: Preparar y Transferir a Mac 🔄

#### Paso 1: Preparar archivos para transferencia (En Windows)

Primero, vamos a comprimir solo lo necesario para reducir el tamaño:

```powershell
cd C:\Projects\NEST-UI-V2

# Crear carpeta temporal con solo lo necesario
New-Item -ItemType Directory -Force -Path ..\NEST-UI-V2-MAC

# Copiar archivos compilados
Copy-Item -Recurse nest-ui-fe\dist ..\NEST-UI-V2-MAC\nest-ui-fe-dist
Copy-Item -Recurse nest-ui-be\dist ..\NEST-UI-V2-MAC\nest-ui-be-dist
Copy-Item -Recurse nest-electron\dist ..\NEST-UI-V2-MAC\nest-electron-dist

# Copiar configuraciones necesarias
Copy-Item nest-electron\package.json ..\NEST-UI-V2-MAC\
Copy-Item nest-electron\package-lock.json ..\NEST-UI-V2-MAC\
Copy-Item -Recurse nest-electron\src ..\NEST-UI-V2-MAC\src

# Copiar archivos adicionales si los necesitas
Copy-Item -Recurse Base_Files ..\NEST-UI-V2-MAC\Base_Files
Copy-Item -Recurse nest-files-py ..\NEST-UI-V2-MAC\nest-files-py

# Comprimir todo
cd ..
Compress-Archive -Path NEST-UI-V2-MAC -DestinationPath NEST-UI-V2-MAC.zip -Force

Write-Host "✅ Archivo listo: NEST-UI-V2-MAC.zip" -ForegroundColor Green
Write-Host "📦 Tamaño aproximado: $([math]::Round((Get-Item NEST-UI-V2-MAC.zip).Length / 1MB, 2)) MB" -ForegroundColor Cyan
```

**Resultado:** Tendrás un archivo `NEST-UI-V2-MAC.zip` optimizado para transferir.

---

#### Paso 2: Transferir a Mac

Elige el método que prefieras:

##### 🔷 Opción A: USB/Disco Externo (Recomendado - Más Rápido) ⭐

**En Windows:**

1. Conecta tu USB al PC
2. Copia `NEST-UI-V2-MAC.zip` al USB
3. Expulsa el USB de forma segura

**En Mac:**

1. Conecta el USB a tu Mac
2. Abre Finder y localiza el USB
3. Copia `NEST-UI-V2-MAC.zip` a tu carpeta de Descargas o Documentos
4. Descomprime el archivo:

```bash
cd ~/Downloads  # o donde hayas copiado el archivo
unzip NEST-UI-V2-MAC.zip
mv NEST-UI-V2-MAC ~/Projects/nest-electron
```

**Ventajas:**

- ⚡ Muy rápido (5-10 MB/s o más)
- 🔒 No requiere internet
- 💯 100% confiable
- 📦 Ideal para archivos grandes

**Tiempo estimado:** 2-5 minutos

---

##### 🔷 Opción B: Nube (Dropbox, Google Drive, OneDrive)

**En Windows:**

1. Abre tu servicio de nube en el navegador
2. Sube `NEST-UI-V2-MAC.zip`
3. Espera a que termine la subida

**En Mac:**

1. Abre el mismo servicio de nube
2. Descarga `NEST-UI-V2-MAC.zip`
3. Descomprime:

```bash
cd ~/Downloads
unzip NEST-UI-V2-MAC.zip
mv NEST-UI-V2-MAC ~/Projects/nest-electron
```

**Ventajas:**

- ☁️ Accesible desde cualquier lugar
- 💾 Queda como backup
- 📱 Puedes descargarlo después

**Tiempo estimado:** 10-30 minutos (depende de tu internet)

---

##### 🔷 Opción C: AirDrop (vía iPhone/iPad como puente)

**En Windows:**

1. Envía `NEST-UI-V2-MAC.zip` a tu iPhone/iPad por:
   - Email a ti mismo
   - WhatsApp/Telegram a ti mismo
   - OneDrive/iCloud

**En iPhone/iPad:**

1. Descarga el archivo
2. Mantén presionado el archivo
3. Selecciona "Compartir" → "AirDrop"
4. Elige tu Mac

**En Mac:**

1. Acepta el archivo (se guarda en Descargas)
2. Descomprime:

```bash
cd ~/Downloads
unzip NEST-UI-V2-MAC.zip
mv NEST-UI-V2-MAC ~/Projects/nest-electron
```

**Ventajas:**

- 📱 Usa dispositivos que ya tienes
- 🚀 AirDrop es muy rápido
- 🔄 Útil si no tienes USB

**Tiempo estimado:** 5-15 minutos

---

##### 🔷 Opción D: Carpeta Compartida en Red Local

**En Windows:**

1. Clic derecho en la carpeta `NEST-UI-V2-MAC`
2. Propiedades → Compartir → Compartir...
3. Agrega "Todos" con permiso de lectura
4. Anota la ruta de red (ej: `\\DESKTOP-PC\Users\Usuario\NEST-UI-V2-MAC`)

**En Mac:**

1. Abre Finder
2. Menú "Ir" → "Conectar al servidor" (Cmd+K)
3. Escribe: `smb://IP-DE-TU-PC/NEST-UI-V2-MAC`
4. Copia la carpeta a tu Mac:

```bash
# La carpeta aparecerá montada en /Volumes/
cp -r /Volumes/NEST-UI-V2-MAC ~/Projects/nest-electron
```

**Ventajas:**

- 🌐 No necesitas USB
- ⚡ Rápido en red local
- 🔄 Puedes sincronizar cambios fácilmente

**Tiempo estimado:** 5-10 minutos

---

##### 🔷 Opción E: Transferencia por Cable (iPhone/iPad con iTunes)

**En Windows:**

1. Conecta tu iPhone/iPad al PC
2. Abre iTunes o la app de Archivos
3. Copia `NEST-UI-V2-MAC.zip` a la app "Archivos" del iPhone

**En Mac:**

1. Conecta el mismo iPhone/iPad
2. Abre Finder (el iPhone aparece en la barra lateral)
3. Ve a "Archivos" y copia el ZIP a tu Mac
4. Descomprime:

```bash
cd ~/Downloads
unzip NEST-UI-V2-MAC.zip
mv NEST-UI-V2-MAC ~/Projects/nest-electron
```

**Ventajas:**

- 🔌 No necesitas USB adicional
- 📱 Usa el cable del iPhone
- 💯 Confiable

**Tiempo estimado:** 10-15 minutos

---

#### Paso 3: Verificar la transferencia (En Mac)

```bash
cd ~/Projects/nest-electron

# Verificar que todo está
ls -la

# Deberías ver:
# - package.json
# - nest-ui-fe-dist/
# - nest-ui-be-dist/
# - nest-electron-dist/
# - src/
# - Base_Files/ (opcional)
# - nest-files-py/ (scripts Python)
```

**⚠️ IMPORTANTE - Python Embebido:**

Si tu app usa Python, necesitas preparar Python embebido en Mac. Los scripts Python NO funcionarán si el usuario no tiene Python instalado.

**Opciones:**

1. **Incluir Python embebido** (Recomendado) - Ver: `GUIA-PYTHON-EMBEBIDO-MAC.md`
2. **Pedir al usuario instalar Python** (No recomendado)

Para incluir Python embebido, ejecuta antes de continuar:

```bash
# Crear Python embebido (solo primera vez o cuando cambien bibliotecas)
./prepare-python-mac.sh

# O manualmente:
cd ~/Projects
mkdir -p nest-files-py-embedded-mac
cd nest-files-py-embedded-mac
python3 -m venv python-runtime
source python-runtime/bin/activate
pip install pypdf pillow reportlab openpyxl requests pandas numpy
cp ../nest-files-py/*.py .
deactivate
```

---

### Fase 3: En Mac (Solo el paso final) 🍎

#### Paso 1: Reorganizar archivos

```bash
cd ~/Projects/nest-electron

# Crear estructura correcta
mkdir -p ../nest-ui-fe/dist/nest-ui-fe/browser
mkdir -p ../nest-ui-be/dist

# Mover archivos a sus ubicaciones correctas
mv nest-ui-fe-dist/* ../nest-ui-fe/dist/nest-ui-fe/browser/
mv nest-ui-be-dist/* ../nest-ui-be/dist/
mv nest-electron-dist/* dist/

# Limpiar carpetas temporales
rm -rf nest-ui-fe-dist nest-ui-be-dist nest-electron-dist
```

#### Paso 2: Verificar Node.js y npm (solo la primera vez)

```bash
# Verificar versiones
node --version  # Debe ser v18 o superior
npm --version   # Debe ser v9 o superior

# Si no tienes Node.js, instalar con Homebrew:
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# brew install node
```

#### Paso 3: Instalar dependencias de Electron (solo la primera vez)

```bash
cd ~/Projects/nest-electron
npm install
```

**Nota:** Este paso puede tardar 2-3 minutos la primera vez.

#### Paso 4: Crear el instalador DMG

```bash
npm run dist:mac
```

**Tiempo estimado:** 2-5 minutos

✅ **¡Listo!** El DMG se crea en `nest-electron/release/`

#### Paso 5: Verificar el instalador

```bash
# Ver el DMG creado
ls -lh release/*.dmg

# Abrir la carpeta en Finder
open release/

# Probar la instalación
open release/*.dmg
```

---

## ⚡ Versión Rápida (Resumen)

### En Windows:

```powershell
cd C:\Projects\NEST-UI-V2

# 1. Compilar todo
cd nest-ui-fe && npm run build
cd ..\nest-ui-be && npm run build
cd ..\nest-electron && npm run build
cd ..

# 2. Preparar para transferencia
New-Item -ItemType Directory -Force -Path ..\NEST-UI-V2-MAC
Copy-Item -Recurse nest-ui-fe\dist ..\NEST-UI-V2-MAC\nest-ui-fe-dist
Copy-Item -Recurse nest-ui-be\dist ..\NEST-UI-V2-MAC\nest-ui-be-dist
Copy-Item -Recurse nest-electron\dist ..\NEST-UI-V2-MAC\nest-electron-dist
Copy-Item nest-electron\package*.json ..\NEST-UI-V2-MAC\
Copy-Item -Recurse nest-electron\src ..\NEST-UI-V2-MAC\src

# 3. Comprimir
cd ..
Compress-Archive -Path NEST-UI-V2-MAC -DestinationPath NEST-UI-V2-MAC.zip -Force

# 4. Transferir NEST-UI-V2-MAC.zip a Mac (USB, nube, etc.)
```

### En Mac:

```bash
# 1. Descomprimir
cd ~/Downloads
unzip NEST-UI-V2-MAC.zip
mv NEST-UI-V2-MAC ~/Projects/nest-electron
cd ~/Projects/nest-electron

# 2. Reorganizar archivos
mkdir -p ../nest-ui-fe/dist/nest-ui-fe/browser ../nest-ui-be/dist
mv nest-ui-fe-dist/* ../nest-ui-fe/dist/nest-ui-fe/browser/
mv nest-ui-be-dist/* ../nest-ui-be/dist/
mv nest-electron-dist/* dist/

# 3. Instalar dependencias (solo primera vez)
npm install

# 4. Crear DMG
npm run dist:mac
```

**Tiempo en Mac: ~5-10 minutos** ⏱️

---

## 🎯 Ventajas de Este Método

✅ **Haces el 90% del trabajo en Windows**
✅ **Solo necesitas el Mac 2-5 minutos**
✅ **No necesitas configurar todo el entorno en Mac**
✅ **Más rápido que compilar todo en Mac**
✅ **Puedes usar tu Mac mientras compila**

---

## 📦 Qué se Transfiere

### Archivos Compilados (NECESARIOS):

```
NEST-UI-V2/
├── nest-ui-fe/dist/          ✅ Compilado en Windows
├── nest-ui-be/dist/          ✅ Compilado en Windows
├── nest-electron/dist/       ✅ Compilado en Windows
├── nest-files-py/            ✅ Scripts Python
└── Base_Files/               ✅ Archivos base
```

### Archivos de Configuración (NECESARIOS):

```
├── nest-electron/package.json     ✅ Configuración de build
├── nest-electron/tsconfig.json    ✅ Config TypeScript
└── nest-electron/src/             ✅ Código fuente (por si acaso)
```

### NO necesitas transferir:

```
❌ node_modules/  (se instalan en Mac)
❌ .angular/      (caché)
❌ .git/          (si usas Git, se clona)
```

---

## 🚀 Script Automatizado

### Para Windows: `compile-for-mac.ps1`

```powershell
# compile-for-mac.ps1
Write-Host "🚀 Compilando para Mac..." -ForegroundColor Blue

# Compilar Frontend
Write-Host "▶ Compilando Frontend..." -ForegroundColor Cyan
cd nest-ui-fe
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

# Compilar Backend
Write-Host "▶ Compilando Backend..." -ForegroundColor Cyan
cd ..\nest-ui-be
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

# Compilar Electron
Write-Host "▶ Compilando Electron..." -ForegroundColor Cyan
cd ..\nest-electron
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

cd ..

Write-Host "✅ Compilación completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Ahora transfiere la carpeta NEST-UI-V2 a tu Mac" -ForegroundColor Yellow
Write-Host "🍎 En Mac, ejecuta: cd nest-electron && npm install && npm run dist:mac" -ForegroundColor Yellow
```

### Para Mac: `create-dmg.sh`

```bash
#!/bin/bash
# create-dmg.sh

echo "🍎 Creando instalador DMG..."

cd nest-electron

# Instalar dependencias (solo primera vez)
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Crear DMG
echo "🔨 Creando DMG..."
npm run dist:mac

if [ $? -eq 0 ]; then
    echo "✅ DMG creado exitosamente!"
    echo "📍 Ubicación: nest-electron/release/"
    open release/
else
    echo "❌ Error al crear DMG"
    exit 1
fi
```

---

## 💡 Optimizaciones

### 1. Comprimir antes de transferir

```powershell
# En Windows
Compress-Archive -Path C:\Projects\NEST-UI-V2 -DestinationPath NEST-UI-V2.zip
```

```bash
# En Mac
unzip NEST-UI-V2.zip
```

### 2. Transferir solo lo necesario

Crea un archivo `.transferignore` con:

```
node_modules/
.angular/
.git/
*.log
*.tmp
release/
```

### 3. Usar rsync (si ambos están en red)

```bash
# Desde Mac, sincronizar desde Windows
rsync -avz --exclude 'node_modules' usuario@windows-pc:/Projects/NEST-UI-V2/ ~/Projects/NEST-UI-V2/
```

---

## 🔄 Flujo de Trabajo Típico

### Primera Vez:

1. **Windows:** Compilar todo (10 min)
2. **Transferir:** USB/Git (5-10 min)
3. **Mac:** `npm install` en nest-electron (2 min)
4. **Mac:** `npm run dist:mac` (3 min)

**Total: ~20-25 minutos**

### Actualizaciones:

1. **Windows:** Compilar cambios (5 min)
2. **Transferir:** Solo archivos cambiados (2 min)
3. **Mac:** `npm run dist:mac` (3 min)

**Total: ~10 minutos**

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"

```bash
# En Mac, reinstalar dependencias
cd nest-electron
rm -rf node_modules package-lock.json
npm install
```

### Error: "ENOENT: no such file or directory"

```bash
# Verificar que los archivos compilados existen
ls -la ../nest-ui-fe/dist/nest-ui-fe/browser/
ls -la ../nest-ui-be/dist/
ls -la dist/

# Si faltan, recompilar en Windows y transferir de nuevo
```

### Error: "Platform darwin is not supported"

Este error aparece si intentas ejecutar `npm run dist:mac` en Windows. Solo puedes crear DMG en Mac.

### El DMG no incluye los archivos

Verifica `nest-electron/package.json`:

```json
{
  "build": {
    "extraResources": [
      {
        "from": "../nest-ui-fe/dist/nest-ui-fe/browser",
        "to": "frontend"
      },
      {
        "from": "../nest-ui-be/dist",
        "to": "backend/dist"
      },
      {
        "from": "../nest-ui-be/node_modules",
        "to": "backend/node_modules"
      }
    ]
  }
}
```

### Error: "Code signing required"

Si necesitas firmar la app para distribución:

```bash
# Configurar certificado de desarrollador de Apple
export APPLE_ID="tu-email@example.com"
export APPLE_ID_PASSWORD="tu-app-specific-password"
export APPLE_TEAM_ID="tu-team-id"

# Luego ejecutar
npm run dist:mac
```

### Error de permisos en Mac

```bash
# Dar permisos de ejecución a scripts
chmod +x create-dmg.sh
chmod +x build-mac.sh

# Ejecutar
./create-dmg.sh
```

### El DMG se crea pero la app no abre

```bash
# Verificar la estructura del DMG
hdiutil attach release/*.dmg
ls -la /Volumes/*/

# Verificar permisos
xattr -cr /Volumes/*/*.app
```

---

## 📊 Comparación de Métodos de Transferencia

| Método                  | Velocidad  | Requiere Internet | Complejidad | Recomendado Para                |
| ----------------------- | ---------- | ----------------- | ----------- | ------------------------------- |
| **USB/Disco Externo**   | ⭐⭐⭐⭐⭐ | ❌ No             | ⭐⭐⭐⭐    | Primera vez, archivos grandes   |
| **Carpeta Red Local**   | ⭐⭐⭐⭐   | ❌ No             | ⭐⭐⭐      | Actualizaciones frecuentes      |
| **AirDrop (iPhone)**    | ⭐⭐⭐⭐   | ❌ No             | ⭐⭐⭐⭐    | Si no tienes USB                |
| **Nube (Drive/Dropbox** | ⭐⭐⭐     | ✅ Sí             | ⭐⭐⭐⭐⭐  | Backup + transferencia          |
| **Cable iPhone/iTunes** | ⭐⭐⭐     | ❌ No             | ⭐⭐        | Si tienes cable iPhone          |
| **Git/GitHub**          | ⭐⭐       | ✅ Sí             | ⭐⭐⭐      | Si ya usas control de versiones |

---

## ✅ Checklist

Antes de transferir a Mac:

- [ ] Frontend compilado (`nest-ui-fe/dist/`)
- [ ] Backend compilado (`nest-ui-be/dist/`)
- [ ] Electron compilado (`nest-electron/dist/`)
- [ ] Scripts Python incluidos
- [ ] `package.json` de Electron incluido
- [ ] Archivos Base_Files incluidos (opcional)

En Mac:

- [ ] Carpeta transferida completamente
- [ ] `npm install` ejecutado en nest-electron
- [ ] `npm run dist:mac` ejecutado
- [ ] DMG creado en `release/`

---

## 🎯 Recomendación Final

**Este método es ideal si:**

- ✅ Tienes acceso ocasional a un Mac
- ✅ Quieres hacer la mayor parte del trabajo en Windows
- ✅ No quieres configurar todo el entorno en Mac
- ✅ Necesitas crear el DMG rápidamente

**Usa GitHub Actions si:**

- ❌ No tienes acceso a un Mac
- ✅ Quieres automatizar completamente
- ✅ Necesitas compilar para múltiples plataformas

---

## � Consejos Prácticos

### Para Transferencias Frecuentes:

1. **Usa carpeta compartida en red** - Es el método más rápido para actualizaciones
2. **Mantén el USB dedicado** - Ten un USB solo para esto
3. **Automatiza la preparación** - Usa el script `compile-for-mac.ps1`

### Para Optimizar el Tamaño:

```powershell
# Excluir archivos innecesarios al comprimir
$exclude = @('*.log', '*.tmp', '.DS_Store', 'Thumbs.db')
Get-ChildItem -Path NEST-UI-V2-MAC -Recurse |
    Where-Object { $exclude -notcontains $_.Extension } |
    Compress-Archive -DestinationPath NEST-UI-V2-MAC.zip
```

### Si el ZIP es muy grande:

```powershell
# Dividir en partes de 100MB para email/WhatsApp
$source = "NEST-UI-V2-MAC.zip"
$destination = "NEST-UI-V2-MAC"
$partSize = 100MB

# Usar 7-Zip si está instalado
7z a -v100m "$destination.7z" $source
```

### Verificar integridad después de transferir:

```powershell
# En Windows - Generar checksum
Get-FileHash NEST-UI-V2-MAC.zip -Algorithm SHA256 | Select-Object Hash
```

```bash
# En Mac - Verificar checksum
shasum -a 256 NEST-UI-V2-MAC.zip
```

---

## 📝 Resumen

**SÍ, puedes compilar en Windows y solo usar el Mac para crear el DMG.**

Es como preparar todos los ingredientes en casa y solo usar el horno del vecino para hornear. 🍰

**Pasos:**

1. Compila todo en Windows
2. Prepara y comprime los archivos necesarios
3. Transfiere a Mac (USB recomendado)
4. En Mac: reorganiza, `npm install` y `npm run dist:mac`
5. ¡Listo! 🎉

**Tiempo total: ~10-20 minutos** (la mayoría es transferencia)

**Método recomendado:** USB/Disco Externo por velocidad y confiabilidad.
