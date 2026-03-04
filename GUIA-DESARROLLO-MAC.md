# Guía: Pasar la Aplicación Electron a Mac

Esta guía te ayudará a configurar y ejecutar tu aplicación Electron en macOS.

## 📋 Requisitos Previos

### 1. Instalar Homebrew (si no lo tienes)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Instalar Node.js y npm

```bash
# Instalar Node.js (versión LTS recomendada)
brew install node

# Verificar instalación
node --version
npm --version
```

### 3. Instalar Python (para los scripts de Python)

```bash
# Instalar Python 3
brew install python3

# Verificar instalación
python3 --version
pip3 --version
```

### 4. Instalar Git (si no lo tienes)

```bash
brew install git
```

---

## 🚀 Paso 1: Transferir el Proyecto a Mac

### Opción A: Usando Git (Recomendado)

```bash
# En Windows, sube tu proyecto a GitHub/GitLab
cd C:\Projects\NEST-UI-V2
git init
git add .
git commit -m "Initial commit"
git remote add origin <tu-repositorio-url>
git push -u origin main

# En Mac, clona el repositorio
cd ~/Projects
git clone <tu-repositorio-url>
cd NEST-UI-V2
```

### Opción B: Usando USB o Transferencia de Red

```bash
# Copia la carpeta completa del proyecto a tu Mac
# Luego en Mac:
cd ~/Projects/NEST-UI-V2
```

---

## 🔧 Paso 2: Instalar Dependencias

### 2.1 Frontend (Angular)

```bash
cd nest-ui-fe
npm install

# Si hay errores, intenta:
npm install --legacy-peer-deps
```

### 2.2 Backend (NestJS)

```bash
cd ../nest-ui-be
npm install
```

### 2.3 Electron

```bash
cd ../nest-electron
npm install
```

### 2.4 Dependencias de Python

```bash
# Instalar dependencias de Python
pip3 install reportlab
pip3 install PyPDF2
# Agrega otras dependencias que uses
```

---

## 🛠️ Paso 3: Configurar para macOS

### 3.1 Actualizar rutas en el código

El código ya tiene detección de OS, pero verifica estos archivos:

**nest-ui-fe/src/app/pages/set-up/set-up.ts:**

```typescript
setOS(os: 'windows' | 'macos'): void {
  this.operatingSystem.set(os);
  if (os === 'macos') {
    this.basePath.set('/Users/Production/Base_Files'); // ✅ Ya configurado
  } else {
    this.basePath.set('C:\\Projects\\NEST-UI-V2\\Base_Files');
  }
}
```

### 3.2 Crear carpeta Base_Files en Mac

```bash
# Crear la estructura de carpetas
mkdir -p ~/Production/Base_Files
# O la ruta que prefieras

# Copiar los archivos base desde Windows
# Puedes usar USB o transferencia de red
```

---

## 🏗️ Paso 4: Compilar el Proyecto

### 4.1 Compilar Frontend

```bash
cd nest-ui-fe
npm run build

# Verificar que se creó la carpeta dist
ls -la dist/nest-ui-fe/browser
```

### 4.2 Compilar Backend

```bash
cd ../nest-ui-be
npm run build

# Verificar que se creó la carpeta dist
ls -la dist
```

### 4.3 Compilar Electron

```bash
cd ../nest-electron
npm run build

# Verificar que se creó la carpeta dist
ls -la dist
```

---

## 🚀 Paso 5: Ejecutar en Modo Desarrollo

### Opción A: Ejecutar todo desde la raíz

```bash
# Desde la raíz del proyecto
cd ~/Projects/NEST-UI-V2

# Terminal 1: Frontend
cd nest-ui-fe && npm start

# Terminal 2: Backend (nueva terminal)
cd nest-ui-be && npm run start:dev

# Terminal 3: Electron (nueva terminal)
cd nest-electron && npm run dev
```

### Opción B: Usar el script de build-all (si existe)

```bash
# Desde la raíz
./build-all.sh
```

---

## 📦 Paso 6: Crear Instalador para Mac

### 6.1 Compilar todo

```bash
# Compilar frontend
cd nest-ui-fe
npm run build

# Compilar backend
cd ../nest-ui-be
npm run build

# Compilar electron
cd ../nest-electron
npm run build
```

### 6.2 Crear el instalador DMG

```bash
cd nest-electron
npm run dist:mac
```

Esto creará:

- `nest-electron/release/Production Processing-1.0.0.dmg`
- `nest-electron/release/mac/Production Processing.app`

### 6.3 Instalar la aplicación

```bash
# Abrir el DMG
open release/Production\ Processing-1.0.0.dmg

# Arrastrar la app a la carpeta Applications
# O hacer doble clic en el instalador
```

---

## 🔐 Paso 7: Configurar Permisos de macOS

### 7.1 Permitir aplicaciones de desarrolladores no identificados

```bash
# Si macOS bloquea la app, ejecuta:
xattr -cr "/Applications/Production Processing.app"

# O desde Preferencias del Sistema:
# System Preferences > Security & Privacy > General
# Click "Open Anyway" para la app bloqueada
```

### 7.2 Permisos de Python

```bash
# Si Python necesita permisos, otórgalos desde:
# System Preferences > Security & Privacy > Privacy
# Selecciona "Files and Folders" o "Full Disk Access"
```

---

## 🐛 Solución de Problemas Comunes

### Problema 1: "command not found: npm"

```bash
# Reinstalar Node.js
brew install node
# O descargar desde: https://nodejs.org/
```

### Problema 2: Errores de permisos en npm

```bash
# Cambiar propietario de la carpeta npm
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Problema 3: Python no encuentra módulos

```bash
# Instalar módulos globalmente
pip3 install --user reportlab PyPDF2

# O crear un entorno virtual
python3 -m venv venv
source venv/bin/activate
pip install reportlab PyPDF2
```

### Problema 4: Electron no inicia

```bash
# Limpiar caché y reinstalar
cd nest-electron
rm -rf node_modules package-lock.json
npm install
npm run build
npm run dev
```

### Problema 5: Backend no se conecta

```bash
# Verificar que el puerto 3000 esté libre
lsof -i :3000

# Si está ocupado, matar el proceso
kill -9 <PID>
```

### Problema 6: Frontend no carga

```bash
# Verificar que el puerto 4200 esté libre
lsof -i :4200

# Limpiar caché de Angular
cd nest-ui-fe
rm -rf .angular dist node_modules
npm install
npm run build
```

---

## 📝 Diferencias entre Windows y Mac

### Rutas de archivos

- **Windows:** `C:\Projects\NEST-UI-V2\Base_Files`
- **Mac:** `/Users/Production/Base_Files` o `~/Production/Base_Files`

### Comandos de terminal

- **Windows PowerShell:** `Remove-Item`, `Get-ChildItem`
- **Mac/Linux Bash:** `rm`, `ls`

### Python

- **Windows:** `python`, `pip`
- **Mac:** `python3`, `pip3`

### Separador de rutas

- **Windows:** `\` (backslash)
- **Mac:** `/` (forward slash)

---

## 🎯 Checklist Final

Antes de distribuir la aplicación en Mac, verifica:

- [ ] Todas las dependencias instaladas
- [ ] Frontend compila sin errores
- [ ] Backend compila sin errores
- [ ] Electron compila sin errores
- [ ] La aplicación inicia correctamente
- [ ] El dark mode funciona
- [ ] Los PDFs se generan correctamente
- [ ] La selección de carpetas funciona
- [ ] Los settings se guardan correctamente
- [ ] El login funciona
- [ ] La aplicación se puede cerrar correctamente

---

## 📚 Recursos Adicionales

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder - macOS](https://www.electron.build/configuration/mac)
- [Node.js Downloads](https://nodejs.org/)
- [Homebrew](https://brew.sh/)
- [Python for Mac](https://www.python.org/downloads/macos/)

---

## 🆘 Soporte

Si encuentras problemas específicos de Mac, revisa:

1. Los logs de la consola de Electron (Cmd+Option+I)
2. Los logs del sistema: `Console.app`
3. Los permisos de la aplicación en System Preferences

---

## 🔄 Actualizar la Aplicación

Para actualizar la aplicación después de hacer cambios:

```bash
# 1. Compilar todo
cd nest-ui-fe && npm run build
cd ../nest-ui-be && npm run build
cd ../nest-electron && npm run build

# 2. Crear nuevo instalador
cd nest-electron
npm run dist:mac

# 3. Instalar la nueva versión
open release/Production\ Processing-1.0.0.dmg
```

---

**¡Listo!** Tu aplicación Electron ahora debería funcionar perfectamente en Mac. 🎉
