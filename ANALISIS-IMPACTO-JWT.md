# 🔐 Análisis de Impacto: Implementación de JWT

**Fecha:** 13 de Marzo, 2026  
**Tarea:** Implementar autenticación JWT en backend y frontend  
**Esfuerzo Estimado:** 2-3 horas  
**Impacto en GitHub Actions:** ⚠️ MEDIO

---

## 📋 Estado Actual

### Backend (nest-ui-be)

```typescript
// auth.service.ts - VACÍO
@Injectable()
export class AuthService {}

// auth.controller.ts - BÁSICO
- Login con credenciales hardcodeadas (admin/admin123)
- Retorna token fake: 'jwt-token-here'
- Sin validación real
- Sin hash de contraseñas
- Sin refresh tokens
```

### Frontend (nest-ui-fe)

```typescript
// auth.service.ts - FUNCIONAL PERO INSEGURO
- Guarda estado en localStorage
- No valida tokens
- No maneja expiración
- No usa interceptors para agregar token a requests
```

### GitHub Actions

```yaml
# build-all-platforms.yml
- Build Backend ✅
- Build Frontend ✅
- Build Electron (Windows/Mac/Linux) ✅
- NO ejecuta tests
- NO valida autenticación
```

---

## 🎯 Cambios Propuestos

### 1. Backend - Implementar JWT Real

#### Dependencias Nuevas

```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.1"
}
```

#### Archivos a Crear/Modificar

**Nuevos:**

- `auth/jwt.strategy.ts` - Estrategia de validación JWT
- `auth/jwt-auth.guard.ts` - Guard para proteger rutas
- `auth/dto/login.dto.ts` - DTO para login
- `auth/dto/register.dto.ts` - DTO para registro (opcional)
- `auth/entities/user.entity.ts` - Entidad de usuario

**Modificar:**

- `auth/auth.service.ts` - Lógica de autenticación real
- `auth/auth.controller.ts` - Endpoints de login/logout/refresh
- `auth/auth.module.ts` - Configuración de JWT
- `app.module.ts` - Importar JwtModule

#### Proteger Rutas

```typescript
// Agregar guard a controladores protegidos
@UseGuards(JwtAuthGuard)
@Controller("facilities")
export class FacilitiesController {}

@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {}

@UseGuards(JwtAuthGuard)
@Controller("settings")
export class SettingsController {}
```

### 2. Frontend - Integrar JWT

#### Archivos a Modificar

**auth.service.ts:**

- Guardar token JWT en localStorage
- Decodificar token para obtener datos de usuario
- Validar expiración de token
- Implementar refresh token

**Nuevo:**

- `interceptors/jwt.interceptor.ts` - Agregar token a todas las requests
- `interceptors/auth-error.interceptor.ts` - Manejar errores 401

**app.config.ts:**

- Registrar interceptors

### 3. Base de Datos - Tabla de Usuarios

**Opción A: JSON (temporal)**

```json
{
  "users": [
    {
      "id": "1",
      "username": "admin",
      "passwordHash": "$2b$10$...",
      "role": "admin",
      "createdAt": "2026-03-13T00:00:00.000Z"
    }
  ]
}
```

**Opción B: SQLite (recomendado)**

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚠️ Impacto en GitHub Actions

### 🟢 Sin Impacto (No Requiere Cambios)

1. **Build Process**
   - ✅ `npm install` instalará las nuevas dependencias automáticamente
   - ✅ `npm run build` compilará el código sin problemas
   - ✅ Electron empaquetará la app normalmente

2. **Dependencias**
   - ✅ `@nestjs/jwt`, `passport`, `bcrypt` son dependencias normales de Node.js
   - ✅ No requieren configuración especial en CI/CD
   - ✅ No afectan el proceso de empaquetado

3. **Tamaño del Bundle**
   - ✅ Incremento mínimo: ~200 KB (bcrypt + jwt)
   - ✅ No afecta significativamente el tamaño final

### 🟡 Impacto Medio (Requiere Atención)

1. **Variables de Entorno**
   - ⚠️ JWT requiere un `JWT_SECRET` para firmar tokens
   - ⚠️ Debe configurarse en GitHub Secrets
   - ⚠️ Debe inyectarse en el build

**Solución:**

```yaml
# .github/workflows/build-all-platforms.yml
- name: Build Backend
  working-directory: nest-ui-be
  run: npm run build
  env:
    JWT_SECRET: ${{ secrets.JWT_SECRET }} # ← AGREGAR
    JWT_EXPIRATION: "12h"
```

2. **Configuración de Producción**
   - ⚠️ El backend empaquetado necesita acceso al JWT_SECRET
   - ⚠️ Debe incluirse en el archivo `.env` o configuración

**Solución:**

```javascript
// nest-electron/build/afterPack.js
const fs = require("fs");
const path = require("path");

module.exports = async function (context) {
  // Crear archivo .env en backend
  const backendPath = path.join(context.appOutDir, "resources", "backend");

  const envContent = `
JWT_SECRET=${process.env.JWT_SECRET || "default-secret-change-in-production"}
JWT_EXPIRATION=12h
  `.trim();

  fs.writeFileSync(path.join(backendPath, ".env"), envContent);
};
```

3. **Primera Ejecución - Crear Usuario Admin**
   - ⚠️ La app necesita un usuario admin inicial
   - ⚠️ Debe crearse automáticamente en el primer arranque

**Solución:**

```typescript
// auth.service.ts
async onModuleInit() {
  await this.createDefaultAdmin();
}

private async createDefaultAdmin() {
  const adminExists = await this.findUserByUsername('admin');
  if (!adminExists) {
    await this.createUser({
      username: 'admin',
      password: 'admin123', // Usuario debe cambiar en primer login
      role: 'admin'
    });
  }
}
```

### 🔴 Impacto Alto (Requiere Cambios Importantes)

**NINGUNO** - La implementación de JWT no tiene impactos críticos en GitHub Actions.

---

## 📊 Comparación: Antes vs Después

### Antes (Estado Actual)

| Aspecto        | Estado              |
| -------------- | ------------------- |
| Autenticación  | ❌ Fake (hardcoded) |
| Tokens         | ❌ String fake      |
| Seguridad      | ❌ Muy baja         |
| Expiración     | ❌ No existe        |
| Refresh        | ❌ No existe        |
| Contraseñas    | ❌ Plain text       |
| GitHub Actions | ✅ Funciona         |

### Después (Con JWT)

| Aspecto        | Estado                    |
| -------------- | ------------------------- |
| Autenticación  | ✅ Real con JWT           |
| Tokens         | ✅ JWT firmado            |
| Seguridad      | ✅ Alta (bcrypt + JWT)    |
| Expiración     | ✅ 12 horas configurable  |
| Refresh        | ✅ Refresh tokens         |
| Contraseñas    | ✅ Hasheadas con bcrypt   |
| GitHub Actions | ✅ Funciona (con secrets) |

---

## 🔧 Cambios Requeridos en GitHub Actions

### 1. Agregar Secrets

**En GitHub Repository → Settings → Secrets:**

```
JWT_SECRET=tu-secreto-super-seguro-aqui-cambiar-en-produccion
```

### 2. Modificar Workflow

```yaml
# .github/workflows/build-all-platforms.yml

# ANTES:
- name: Build Backend
  working-directory: nest-ui-be
  run: npm run build

# DESPUÉS:
- name: Build Backend
  working-directory: nest-ui-be
  run: npm run build
  env:
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    JWT_EXPIRATION: "12h"
```

### 3. Modificar afterPack.js

```javascript
// nest-electron/build/afterPack.js

module.exports = async function (context) {
  const fs = require("fs");
  const path = require("path");

  // Crear .env para backend
  const backendPath = path.join(context.appOutDir, "resources", "backend");

  const envContent = `
JWT_SECRET=${process.env.JWT_SECRET || "default-secret-change-in-production"}
JWT_EXPIRATION=${process.env.JWT_EXPIRATION || "12h"}
NODE_ENV=production
  `.trim();

  fs.writeFileSync(path.join(backendPath, ".env"), envContent);

  console.log("✅ Backend .env created");
};
```

---

## 🚀 Plan de Implementación

### Fase 1: Backend (1-1.5 horas)

1. **Instalar dependencias**

   ```bash
   cd nest-ui-be
   npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
   npm install -D @types/passport-jwt @types/bcrypt
   ```

2. **Crear archivos JWT**
   - `jwt.strategy.ts`
   - `jwt-auth.guard.ts`
   - `login.dto.ts`

3. **Implementar auth.service.ts**
   - Hash de contraseñas con bcrypt
   - Generación de JWT
   - Validación de usuarios

4. **Actualizar auth.controller.ts**
   - Endpoint `/login` real
   - Endpoint `/refresh` para refresh tokens
   - Endpoint `/me` para obtener usuario actual

5. **Proteger rutas**
   - Agregar `@UseGuards(JwtAuthGuard)` a controladores

### Fase 2: Frontend (0.5-1 hora)

1. **Actualizar auth.service.ts**
   - Guardar JWT en localStorage
   - Decodificar token
   - Validar expiración

2. **Crear interceptors**
   - `jwt.interceptor.ts` - Agregar token a requests
   - `auth-error.interceptor.ts` - Manejar 401

3. **Registrar interceptors**
   - Actualizar `app.config.ts`

### Fase 3: GitHub Actions (0.5 horas)

1. **Agregar secrets**
   - `JWT_SECRET` en GitHub

2. **Actualizar workflow**
   - Pasar `JWT_SECRET` como env variable

3. **Actualizar afterPack.js**
   - Crear `.env` en backend empaquetado

### Fase 4: Testing (0.5 horas)

1. **Test local**
   - Login con credenciales
   - Verificar token en requests
   - Verificar expiración

2. **Test en build**
   - Ejecutar workflow manualmente
   - Verificar que el build funciona
   - Verificar que la app empaquetada funciona

---

## ✅ Checklist de Implementación

### Backend

- [ ] Instalar dependencias JWT
- [ ] Crear `jwt.strategy.ts`
- [ ] Crear `jwt-auth.guard.ts`
- [ ] Crear DTOs de login
- [ ] Implementar `auth.service.ts` con bcrypt
- [ ] Actualizar `auth.controller.ts`
- [ ] Configurar `auth.module.ts` con JwtModule
- [ ] Proteger rutas con `@UseGuards(JwtAuthGuard)`
- [ ] Crear usuario admin por defecto
- [ ] Agregar variables de entorno (.env)

### Frontend

- [ ] Actualizar `auth.service.ts` para JWT
- [ ] Crear `jwt.interceptor.ts`
- [ ] Crear `auth-error.interceptor.ts`
- [ ] Registrar interceptors en `app.config.ts`
- [ ] Actualizar guards para validar token

### GitHub Actions

- [ ] Agregar `JWT_SECRET` en GitHub Secrets
- [ ] Actualizar workflow para pasar env variables
- [ ] Actualizar `afterPack.js` para crear `.env`
- [ ] Test manual del workflow

### Testing

- [ ] Test de login local
- [ ] Test de rutas protegidas
- [ ] Test de expiración de token
- [ ] Test de refresh token
- [ ] Test de build en GitHub Actions
- [ ] Test de app empaquetada

---

## 🎯 Riesgos y Mitigaciones

### Riesgo 1: Build falla por falta de JWT_SECRET

**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:** Usar valor por defecto en desarrollo, requerir en producción

### Riesgo 2: App empaquetada no tiene .env

**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:** Verificar afterPack.js, agregar logs

### Riesgo 3: Usuario no puede hacer login después del update

**Probabilidad:** Baja  
**Impacto:** Alto  
**Mitigación:** Crear usuario admin automáticamente en primer arranque

### Riesgo 4: Token expira muy rápido

**Probabilidad:** Baja  
**Impacto:** Medio  
**Mitigación:** Configurar expiración a 12 horas, implementar refresh token

---

## 📈 Beneficios vs Costos

### Beneficios

- ✅ Seguridad real (no fake tokens)
- ✅ Contraseñas hasheadas
- ✅ Expiración de sesiones
- ✅ Refresh tokens
- ✅ Protección de rutas
- ✅ Auditoría de accesos

### Costos

- ⚠️ 2-3 horas de desarrollo
- ⚠️ Configuración de secrets en GitHub
- ⚠️ Incremento de ~200 KB en bundle
- ⚠️ Complejidad adicional en código

---

## 🎓 Conclusión

**Impacto en GitHub Actions: ⚠️ MEDIO**

La implementación de JWT **NO rompe** el proceso de build actual, pero **REQUIERE**:

1. Agregar `JWT_SECRET` en GitHub Secrets
2. Modificar workflow para pasar env variables
3. Actualizar `afterPack.js` para crear `.env`

**Recomendación:** ✅ **PROCEDER CON LA IMPLEMENTACIÓN**

Los cambios son mínimos y los beneficios de seguridad superan ampliamente los costos. El proceso de build seguirá funcionando con ajustes menores.

**Próximo paso:** Implementar JWT siguiendo el plan de 4 fases.
