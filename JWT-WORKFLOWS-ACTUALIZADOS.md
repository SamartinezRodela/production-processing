# ✅ Workflows de GitHub Actions Actualizados

**Fecha:** 13 de Marzo, 2026  
**Cambio:** JWT_EXPIRATION actualizado a 12h en todos los workflows  
**Estado:** ✅ Completado

---

## 📋 Workflows Actualizados

Se actualizaron **3 workflows** de GitHub Actions para incluir las variables de entorno JWT:

### 1. build-all-platforms.yml

**Ubicación:** `.github/workflows/build-all-platforms.yml`

**Jobs actualizados:**

1. **Build Backend**

   ```yaml
   env:
     JWT_SECRET: ${{ secrets.JWT_SECRET }}
     JWT_EXPIRATION: "12h"
   ```

2. **Build Electron (Windows)**

   ```yaml
   env:
     GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     JWT_SECRET: ${{ secrets.JWT_SECRET }}
     JWT_EXPIRATION: "12h"
     NODE_ENV: "production"
   ```

3. **Build Electron (Mac)**

   ```yaml
   env:
     GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     JWT_SECRET: ${{ secrets.JWT_SECRET }}
     JWT_EXPIRATION: "12h"
     NODE_ENV: "production"
   ```

4. **Build Electron (Linux)**
   ```yaml
   env:
     GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     JWT_SECRET: ${{ secrets.JWT_SECRET }}
     JWT_EXPIRATION: "12h"
     NODE_ENV: "production"
   ```

**Total:** 4 jobs actualizados

---

### 2. build-windows.yml

**Ubicación:** `.github/workflows/build-windows.yml`

**Jobs actualizados:**

1. **Build Backend**

   ```yaml
   env:
     JWT_SECRET: ${{ secrets.JWT_SECRET }}
     JWT_EXPIRATION: "12h"
   ```

2. **Build Electron App (Windows)**
   ```yaml
   env:
     GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     JWT_SECRET: ${{ secrets.JWT_SECRET }}
     JWT_EXPIRATION: "12h"
     NODE_ENV: "production"
   ```

**Total:** 2 jobs actualizados

---

### 3. build-mac.yml

**Ubicación:** `.github/workflows/build-mac.yml`

**Jobs actualizados:**

1. **Build Backend**

   ```yaml
   env:
     JWT_SECRET: ${{ secrets.JWT_SECRET }}
     JWT_EXPIRATION: "12h"
   ```

2. **Create Mac App with electron-packager**
   ```yaml
   env:
     JWT_SECRET: ${{ secrets.JWT_SECRET }}
     JWT_EXPIRATION: "12h"
     NODE_ENV: "production"
   ```

**Total:** 2 jobs actualizados

---

## 📊 Resumen Total

| Workflow                | Jobs Actualizados | Variables Agregadas                             |
| ----------------------- | ----------------- | ----------------------------------------------- |
| build-all-platforms.yml | 4                 | JWT_SECRET, JWT_EXPIRATION, NODE_ENV            |
| build-windows.yml       | 2                 | JWT_SECRET, JWT_EXPIRATION, NODE_ENV            |
| build-mac.yml           | 2                 | JWT_SECRET, JWT_EXPIRATION, NODE_ENV            |
| **TOTAL**               | **8 jobs**        | **3 variables por job (24 variables en total)** |

---

## 🔐 Variables de Entorno Configuradas

### JWT_SECRET

- **Fuente:** GitHub Secrets (`${{ secrets.JWT_SECRET }}`)
- **Requerido:** Sí
- **Uso:** Firmar y validar tokens JWT
- **Configuración:** Settings → Secrets and variables → Actions

### JWT_EXPIRATION

- **Valor:** `"12h"` (12 horas)
- **Antes:** `"1h"` (1 hora)
- **Uso:** Tiempo de expiración de tokens JWT
- **Configurable:** Sí (cambiar en workflows)

### NODE_ENV

- **Valor:** `"production"`
- **Uso:** Indicar entorno de producción
- **Afecta:** Optimizaciones de Node.js y NestJS

---

## 🧪 Cómo Verificar

### 1. Verificar Workflows Localmente

```bash
# Ver build-all-platforms.yml
cat .github/workflows/build-all-platforms.yml | grep -A 3 "JWT_EXPIRATION"

# Ver build-windows.yml
cat .github/workflows/build-windows.yml | grep -A 3 "JWT_EXPIRATION"

# Ver build-mac.yml
cat .github/workflows/build-mac.yml | grep -A 3 "JWT_EXPIRATION"
```

### 2. Ejecutar Workflow en GitHub

1. Ve a **Actions** en GitHub
2. Selecciona un workflow (ej: Build All Platforms)
3. Click en **Run workflow**
4. Selecciona la rama
5. Click en **Run workflow**

### 3. Verificar Logs del Build

Busca en los logs:

```
Creating .env file for backend...
[OK] .env file created at: ...
JWT_SECRET: xxx... (64 chars)
JWT_EXPIRATION: 12h
```

### 4. Verificar App Empaquetada

Después del build:

1. Descarga el artifact
2. Instala la app
3. Navega a `resources/backend/.env`
4. Verifica:
   ```env
   JWT_EXPIRATION=12h
   ```

---

## ✅ Checklist de Verificación

### Workflows

- [x] build-all-platforms.yml actualizado (4 jobs)
- [x] build-windows.yml actualizado (2 jobs)
- [x] build-mac.yml actualizado (2 jobs)

### Variables de Entorno

- [x] JWT_SECRET agregado a todos los jobs
- [x] JWT_EXPIRATION=12h en todos los jobs
- [x] NODE_ENV=production en jobs de Electron

### Documentación

- [x] JWT-FASE-3-COMPLETADA.md actualizado
- [x] JWT-TOKEN-EXPIRATION-UPDATE.md creado
- [x] JWT-WORKFLOWS-ACTUALIZADOS.md creado

---

## 🎯 Próximos Pasos

### 1. Configurar JWT_SECRET en GitHub

Si aún no lo has hecho:

1. Ve a Settings → Secrets and variables → Actions
2. Click en **New repository secret**
3. Name: `JWT_SECRET`
4. Secret: Tu clave generada (mínimo 32 caracteres)
5. Click en **Add secret**

### 2. Probar Workflows

Ejecuta cada workflow manualmente:

- [ ] Build All Platforms
- [ ] Build Windows Installer
- [ ] Build Mac Installer

### 3. Verificar Builds

Para cada build:

- [ ] Verificar logs (JWT_EXPIRATION: 12h)
- [ ] Descargar artifact
- [ ] Instalar app
- [ ] Verificar .env en resources/backend
- [ ] Probar login
- [ ] Verificar que el token dura 12 horas

---

## 🎓 Notas Importantes

### 1. Consistencia

Todos los workflows ahora usan:

- JWT_EXPIRATION: "12h"
- NODE_ENV: "production"
- JWT_SECRET: desde GitHub Secrets

### 2. Plataformas Soportadas

Los workflows cubren:

- ✅ Windows (x64)
- ✅ macOS (ARM64 - Apple Silicon)
- ✅ Linux (x64)

### 3. Builds Independientes

Cada workflow puede ejecutarse independientemente:

- `build-all-platforms.yml` - Todas las plataformas en un solo workflow
- `build-windows.yml` - Solo Windows (más rápido)
- `build-mac.yml` - Solo Mac (más rápido)

### 4. Valores por Defecto

Si JWT_SECRET no está configurado:

- Se usa: `default-secret-change-in-production-min-32-chars`
- ⚠️ NO es seguro para producción
- Solo para desarrollo/testing

---

## 📚 Referencias

- [GitHub Actions - Environment Variables](https://docs.github.com/en/actions/learn-github-actions/variables)
- [GitHub Actions - Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Electron Builder - Environment Variables](https://www.electron.build/configuration/configuration#environment-variables)

---

## 🎉 Conclusión

Los 3 workflows de GitHub Actions están **completamente actualizados** con:

- ✅ JWT_SECRET desde GitHub Secrets
- ✅ JWT_EXPIRATION configurado a 12h
- ✅ NODE_ENV configurado a production
- ✅ 8 jobs actualizados en total
- ✅ Consistencia entre todos los workflows

**Próximo paso:** Configurar JWT_SECRET en GitHub y ejecutar un build de prueba.
