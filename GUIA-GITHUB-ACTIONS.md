# Guía Rápida: Compilar para Mac usando GitHub Actions

## 🎯 Resumen

GitHub Actions te permite compilar tu aplicación para Mac **GRATIS** sin necesidad de tener un Mac físico.

---

## 📝 Paso 1: Subir tu Proyecto a GitHub

### 1.1 Crear repositorio en GitHub

1. Ve a [github.com](https://github.com)
2. Click en "New repository"
3. Nombre: `NEST-UI-V2` (o el que prefieras)
4. Click en "Create repository"

### 1.2 Subir tu código desde Windows

```powershell
# En tu proyecto
cd C:\Projects\NEST-UI-V2

# Inicializar Git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit"

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/NEST-UI-V2.git

# Subir a GitHub
git branch -M main
git push -u origin main
```

---

## 🚀 Paso 2: Los Workflows ya están Listos

Ya creé 2 workflows para ti:

### Workflow 1: Solo Mac

- Archivo: `.github/workflows/build-mac.yml`
- Compila solo para Mac
- Más rápido (~5 minutos)

### Workflow 2: Todas las Plataformas

- Archivo: `.github/workflows/build-all-platforms.yml`
- Compila para Windows, Mac y Linux
- Más lento (~15 minutos)

---

## ▶️ Paso 3: Ejecutar el Build

### Opción A: Ejecutar Manualmente

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **"Actions"**
3. Verás los workflows disponibles en el lado izquierdo
4. Click en **"Build Mac Installer"** o **"Build All Platforms"**
5. Click en el botón **"Run workflow"** (arriba a la derecha)
6. Selecciona la rama **"main"**
7. Click en **"Run workflow"** (verde)

### Opción B: Automático al hacer Push

Cada vez que hagas `git push` a la rama `main`, se ejecutará automáticamente.

---

## 📥 Paso 4: Descargar el Instalador

### 4.1 Esperar a que termine

- El build tarda 5-15 minutos
- Verás un círculo amarillo 🟡 mientras está en progreso
- Cuando termine, verás un check verde ✅

### 4.2 Descargar el DMG

1. Click en el workflow que terminó
2. Baja hasta la sección **"Artifacts"**
3. Click en **"Production-Processing-Mac-Installer"**
4. Se descargará un archivo ZIP
5. Descomprime el ZIP para obtener el `.dmg`

---

## 📊 Monitoreo del Build

### Ver el progreso en tiempo real:

1. Click en el workflow en ejecución
2. Click en el job (ej: "build-mac")
3. Verás cada paso ejecutándose en tiempo real

### Ver los logs:

- Click en cualquier paso para ver los detalles
- Útil para debugging si algo falla

---

## 🔄 Actualizar la Aplicación

Cada vez que hagas cambios:

```powershell
# Hacer cambios en tu código
# ...

# Guardar cambios
git add .
git commit -m "Descripción de los cambios"
git push

# GitHub Actions compilará automáticamente
```

---

## 💰 Límites Gratuitos

GitHub Actions es **GRATIS** con límites:

- **2000 minutos/mes** para repositorios privados
- **Ilimitado** para repositorios públicos
- Cada build de Mac usa ~10 minutos
- Puedes hacer ~200 builds/mes gratis

### Ver tu uso:

1. GitHub > Settings > Billing
2. "Actions & Packages"

---

## 🎨 Personalizar el Workflow

### Cambiar cuándo se ejecuta:

```yaml
on:
  push:
    branches: [main, develop] # Agregar más ramas
  pull_request: # En pull requests
  schedule:
    - cron: "0 0 * * 0" # Cada domingo a medianoche
```

### Cambiar la versión de Node.js:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: "20" # Cambiar a Node 20
```

---

## 🐛 Solución de Problemas

### El workflow falla

**1. Revisa los logs:**

- Click en el workflow fallido
- Click en el paso que falló (❌)
- Lee el error

**2. Errores comunes:**

#### "npm ci" falla

```yaml
# Cambiar a npm install
- run: npm install # En lugar de npm ci
```

#### Falta un archivo

```yaml
# Verificar que el archivo existe en el repo
- run: ls -la nest-ui-fe/ # Ver archivos
```

#### Error de Python

```yaml
# Instalar más dependencias
- run: pip install reportlab PyPDF2 pillow
```

### El DMG no se crea

Verifica que `nest-electron/package.json` tenga:

```json
{
  "scripts": {
    "dist:mac": "npm run build && electron-builder --mac"
  }
}
```

---

## 📦 Crear Releases Automáticos

Para crear releases con cada versión:

### 1. Crear un tag:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

### 2. GitHub Actions creará automáticamente:

- Un release en GitHub
- Con los instaladores adjuntos
- Para Windows, Mac y Linux

---

## 🎯 Mejores Prácticas

### 1. Usa branches

```powershell
# Crear branch para desarrollo
git checkout -b develop

# Hacer cambios y push
git push origin develop

# Cuando esté listo, merge a main
git checkout main
git merge develop
git push
```

### 2. Usa tags para versiones

```powershell
# Versión nueva
git tag v1.0.1
git push origin v1.0.1
```

### 3. Protege la rama main

- Settings > Branches > Add rule
- Require pull request reviews
- Require status checks to pass

---

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Electron Builder](https://www.electron.build/)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

---

## ✅ Checklist

Antes de tu primer build:

- [ ] Proyecto subido a GitHub
- [ ] Workflows en `.github/workflows/`
- [ ] `package.json` tiene scripts de build
- [ ] Todas las dependencias en `package.json`
- [ ] Archivos `.gitignore` configurados

---

## 🎉 ¡Listo!

Ahora puedes compilar para Mac desde Windows usando GitHub Actions. Es gratis, automático y confiable.

**Próximos pasos:**

1. Sube tu código a GitHub
2. Ve a Actions
3. Click en "Run workflow"
4. Espera 5-10 minutos
5. Descarga tu DMG

¡Así de simple! 🚀
