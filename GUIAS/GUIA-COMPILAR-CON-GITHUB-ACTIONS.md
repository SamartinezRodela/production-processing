# Guía: Compilar Instaladores con GitHub Actions

## 🎯 Ventajas de Usar GitHub Actions

✅ **Sin problemas de antivirus** - Servidor limpio sin Windows Defender  
✅ **Sin bloqueos de archivos** - Entorno fresco cada vez  
✅ **Gratis** - Para repos públicos (2000 minutos/mes)  
✅ **Automático** - Push y listo  
✅ **Cross-platform** - Compila Windows, Mac y Linux simultáneamente  
✅ **Sin configuración local** - No necesitas instalar nada

---

## 📋 Configuración Inicial

### Paso 1: Subir Código a GitHub

```bash
# Si aún no tienes repo
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### Paso 2: Verificar Workflows

Los workflows ya están creados en:

- `.github/workflows/build-windows.yml` - Solo Windows
- `.github/workflows/build-all-platforms.yml` - Todas las plataformas

---

## 🚀 Cómo Usar

### Opción 1: Build Automático (Push)

```bash
# Hacer cambios
git add .
git commit -m "Update app"
git push

# GitHub Actions compila automáticamente
```

### Opción 2: Build Manual

1. Ve a tu repo en GitHub
2. Click en **Actions**
3. Selecciona **Build Windows Installer**
4. Click en **Run workflow**
5. Espera 10-15 minutos
6. Descarga el instalador

### Opción 3: Release con Tag

```bash
# Crear release
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions:
# 1. Compila automáticamente
# 2. Crea GitHub Release
# 3. Sube instaladores
```

---

## 📦 Descargar Instaladores

### Desde Actions (Builds normales)

1. Ve a **Actions** en GitHub
2. Click en el workflow completado
3. Scroll hasta **Artifacts**
4. Descarga:
   - `windows-installer` - Instalador .exe
   - `windows-portable` - Versión portable

### Desde Releases (Tags)

1. Ve a **Releases** en GitHub
2. Encuentra tu versión (ej: v1.0.0)
3. Descarga el instalador directamente

---

## ⚙️ Workflows Disponibles

### 1. build-windows.yml

**Cuándo se ejecuta:**

- Push a `main` o `master`
- Pull requests
- Manualmente desde Actions
- Tags `v*`

**Qué hace:**

- Compila backend (NestJS)
- Compila frontend (Angular)
- Empaqueta Electron para Windows
- Sube instalador como artifact
- Si es tag, crea GitHub Release

**Tiempo:** ~10-15 minutos

---

### 2. build-all-platforms.yml

**Cuándo se ejecuta:**

- Tags `v*` (releases)
- Manualmente desde Actions

**Qué hace:**

- Compila para Windows, Mac y Linux simultáneamente
- Sube todos los instaladores
- Crea GitHub Release con todos

**Tiempo:** ~20-30 minutos

---

## 🔧 Personalización

### Cambiar Cuándo se Ejecuta

Editar `.github/workflows/build-windows.yml`:

```yaml
on:
  push:
    branches: [main, develop] # Agregar más ramas
  schedule:
    - cron: "0 0 * * 0" # Cada domingo a medianoche
```

### Agregar Notificaciones

```yaml
- name: Notify on Success
  if: success()
  run: echo "Build exitoso!"
  # Aquí puedes agregar notificación a Slack, Discord, etc.
```

### Cambiar Versión de Node.js

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "20" # Cambiar versión
```

---

## 📊 Ejemplo de Flujo Completo

### Desarrollo Normal

```bash
# 1. Hacer cambios
code nest-ui-fe/src/app/app.component.ts

# 2. Commit y push
git add .
git commit -m "Update UI"
git push

# 3. GitHub Actions compila automáticamente
# 4. Esperar 10-15 minutos
# 5. Ir a Actions → Descargar artifact
```

### Crear Release

```bash
# 1. Actualizar versión
# Editar nest-electron/package.json: "version": "1.1.0"

# 2. Commit
git add .
git commit -m "Release v1.1.0"

# 3. Crear tag
git tag v1.1.0
git push origin v1.1.0

# 4. GitHub Actions:
#    - Compila Windows, Mac, Linux
#    - Crea GitHub Release
#    - Sube todos los instaladores

# 5. Usuarios descargan desde:
#    https://github.com/tu-usuario/tu-repo/releases/latest
```

---

## 🐛 Solución de Problemas

### Build Falla en GitHub Actions

**Ver logs:**

1. Actions → Click en workflow fallido
2. Click en el job que falló
3. Expandir el paso que falló
4. Ver error completo

**Errores comunes:**

#### Error: "npm install failed"

```yaml
# Solución: Limpiar cache
- name: Clear npm cache
  run: npm cache clean --force
```

#### Error: "Python not found"

```yaml
# Solución: Agregar setup de Python
- name: Setup Python
  uses: actions/setup-python@v4
  with:
    python-version: "3.13"
```

#### Error: "Out of disk space"

```yaml
# Solución: Limpiar espacio
- name: Free Disk Space
  run: |
    docker system prune -af
    npm cache clean --force
```

---

## 💰 Costos y Límites

### GitHub Actions (Gratis)

**Repos Públicos:**

- ✅ Ilimitado
- ✅ 2000 minutos/mes
- ✅ Suficiente para ~100 builds/mes

**Repos Privados:**

- ⚠️ 2000 minutos/mes (gratis)
- ⚠️ Después: $0.008/minuto

**Cálculo:**

- 1 build Windows: ~15 minutos
- 1 build todas las plataformas: ~30 minutos
- 2000 minutos = ~66 builds completos/mes

---

## 🔒 Seguridad

### Secrets

Si necesitas certificados de firma:

1. Ve a **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Agregar:
   - `WINDOWS_CERTIFICATE` - Certificado .pfx (base64)
   - `CERTIFICATE_PASSWORD` - Contraseña

Usar en workflow:

```yaml
- name: Sign Windows App
  env:
    CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
    PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
  run: |
    # Decodificar y firmar
```

---

## 📝 Checklist

Antes de usar GitHub Actions:

- [ ] Código subido a GitHub
- [ ] Workflows en `.github/workflows/`
- [ ] `package.json` con versión correcta
- [ ] Python embebido en el repo
- [ ] Dependencias en `package.json`
- [ ] Scripts de build funcionando localmente

---

## 🎯 Comandos Útiles

```bash
# Ver status de workflows
gh run list

# Ver logs de último workflow
gh run view --log

# Descargar artifacts
gh run download

# Cancelar workflow corriendo
gh run cancel

# Re-ejecutar workflow fallido
gh run rerun
```

---

## 📚 Recursos

- **GitHub Actions Docs:** https://docs.github.com/actions
- **electron-builder CI:** https://www.electron.build/configuration/configuration#configuration
- **Marketplace:** https://github.com/marketplace?type=actions

---

## ✅ Resumen

**Para compilar en GitHub:**

1. Subir código a GitHub
2. Workflows ya están configurados
3. Push o crear tag
4. Esperar 10-15 minutos
5. Descargar instalador desde Actions o Releases

**Ventajas:**

- ✅ Sin problemas de antivirus
- ✅ Sin configuración local
- ✅ Gratis
- ✅ Automático

**¡Ya no necesitas compilar localmente!** 🎉

---

**Fecha:** Marzo 2026  
**Versión:** 1.0.0
