# ✅ JWT Fase 2: Frontend - COMPLETADA

**Fecha:** 13 de Marzo, 2026  
**Duración:** ~1 hora  
**Estado:** ✅ Completado y compilando correctamente

---

## 📋 Resumen de Cambios

### 🔄 Archivos Modificados

1. **`src/app/service/auth.service.ts`** - Servicio de autenticación actualizado
2. **`src/app/config/app.constants.ts`** - Nuevas constantes de storage
3. **`src/app/app.config.ts`** - Interceptors registrados
4. **`src/app/auth/auth.guard.ts`** - Guard actualizado para validar token

### ✅ Archivos Creados

1. **`src/app/interceptors/jwt.interceptor.ts`** - Agregar token a requests
2. **`src/app/interceptors/auth-error.interceptor.ts`** - Manejar errores 401/403

---

## 🔐 Cambios en AuthService

### Antes (Token Fake)

```typescript
// Guardaba solo username y flag booleano
localStorage.setItem('isLoggedIn', 'true');
localStorage.setItem('username', 'admin');
```

### Después (JWT Real)

```typescript
// Guarda token JWT y datos completos del usuario
localStorage.setItem('jwt_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
localStorage.setItem(
  'user_data',
  JSON.stringify({
    id: '1',
    username: 'admin',
    role: 'admin',
    createdAt: '2026-03-13T...',
  }),
);
```

### Nuevas Funcionalidades

#### 1. Gestión de Tokens JWT

```typescript
// Obtener token
getToken(): string | null

// Decodificar token
decodeToken(token: string): JwtPayload | null

// Verificar si el token expiró
isTokenExpired(token: string): boolean

// Obtener fecha de expiración
getTokenExpirationDate(token: string): Date | null
```

#### 2. Gestión de Usuario

```typescript
// Obtener usuario actual del backend
async getCurrentUser(): Promise<User | null>

// Obtener rol del usuario
getUserRole(): string | null

// Verificar si es admin
isAdmin(): boolean
```

#### 3. Validación de Sesión

```typescript
// Verifica token válido y no expirado
isUserLoggedIn(): boolean {
  const token = this.getToken();
  return this.isAuthenticated() && !!token && !this.isTokenExpired(token);
}
```

---

## 🔌 Interceptors Implementados

### 1. JWT Interceptor

**Archivo:** `src/app/interceptors/jwt.interceptor.ts`

**Función:** Agregar token JWT a todas las requests HTTP

```typescript
// Automáticamente agrega el header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Lógica:**

- Obtiene el token del AuthService
- Verifica que no esté expirado
- Clona la request y agrega el header Authorization
- Solo se agrega si hay token válido

### 2. Auth Error Interceptor

**Archivo:** `src/app/interceptors/auth-error.interceptor.ts`

**Función:** Manejar errores de autenticación

**Maneja:**

- **401 Unauthorized:** Token inválido o expirado
  - Muestra notificación: "Session expired. Please login again."
  - Limpia la sesión
  - Redirige al login

- **403 Forbidden:** Sin permisos
  - Muestra notificación: "You do not have permission..."

---

## 📦 Constantes Actualizadas

### Nuevas Storage Keys

```typescript
export const STORAGE_KEYS = {
  IS_LOGGED_IN: 'isLoggedIn', // Legacy - compatibilidad
  USERNAME: 'username', // Legacy - compatibilidad
  JWT_TOKEN: 'jwt_token', // ✅ NUEVO - token JWT
  USER_DATA: 'user_data', // ✅ NUEVO - datos del usuario
  THEME: 'theme',
  APP_SETTINGS: 'appSettings',
} as const;
```

---

## 🔄 Flujo de Autenticación

### Login

```
1. Usuario ingresa credenciales
   ↓
2. POST /auth/login
   ↓
3. Backend valida y retorna JWT
   ↓
4. Frontend guarda token y user data
   ↓
5. Actualiza signals (isAuthenticated, currentUser)
   ↓
6. Redirige a /home
```

### Request Protegido

```
1. Usuario hace request (ej: GET /facilities)
   ↓
2. JWT Interceptor agrega header Authorization
   ↓
3. Backend valida token con JwtStrategy
   ↓
4. Si válido: retorna datos
   Si inválido: retorna 401
   ↓
5. Auth Error Interceptor maneja 401
   ↓
6. Limpia sesión y redirige a login
```

### Logout

```
1. Usuario hace click en logout
   ↓
2. AuthService.logout()
   ↓
3. Limpia token y user data de localStorage
   ↓
4. Actualiza signals a false/null
   ↓
5. Redirige a /login
```

---

## 🧪 Cómo Probar

### 1. Iniciar Backend

```bash
cd nest-ui-be
npm run start:dev
```

### 2. Iniciar Frontend

```bash
cd nest-ui-fe
npm start
```

### 3. Probar Login

1. Ir a http://localhost:4200/login
2. Ingresar credenciales:
   - Username: `admin`
   - Password: `admin123`
3. Verificar que redirige a /home
4. Abrir DevTools → Application → Local Storage
5. Verificar que existe `jwt_token` y `user_data`

### 4. Probar Token en Requests

1. Abrir DevTools → Network
2. Navegar a cualquier página (ej: Settings)
3. Ver requests HTTP
4. Verificar header: `Authorization: Bearer eyJ...`

### 5. Probar Expiración

1. En DevTools → Console, ejecutar:

```javascript
localStorage.setItem('jwt_token', 'token-invalido');
```

2. Recargar la página
3. Verificar que redirige a /login
4. Verificar notificación: "Session expired"

### 6. Probar Logout

1. Hacer login
2. Click en botón logout
3. Verificar que redirige a /login
4. Verificar que localStorage está limpio

---

## 📊 Bundle Size

### Antes

```
Initial: 366.97 kB (87.91 kB comprimido)
```

### Después

```
Initial: 368.81 kB (88.51 kB comprimido)
Incremento: +1.84 kB (+0.6 kB comprimido)
```

**Impacto:** Mínimo (+0.5%)

---

## 🔐 Seguridad Mejorada

### Antes

- ❌ Token fake (string hardcodeado)
- ❌ Sin validación de expiración
- ❌ Sin protección real de rutas
- ❌ Datos en localStorage sin encriptar

### Después

- ✅ Token JWT firmado por backend
- ✅ Validación de expiración automática
- ✅ Protección real de rutas con guards
- ✅ Token se valida en cada request
- ✅ Sesión se limpia automáticamente si expira
- ✅ Manejo de errores 401/403

---

## 🎯 Compatibilidad

### Datos Legacy

El servicio mantiene compatibilidad con datos antiguos:

```typescript
// Limpia datos legacy en logout
localStorage.removeItem('isLoggedIn');
localStorage.removeItem('username');
```

### Migración Automática

- Si el usuario tiene sesión antigua, se limpia automáticamente
- Debe hacer login de nuevo con JWT
- No hay pérdida de datos

---

## ✅ Checklist de Fase 2

- [x] Actualizar `auth.service.ts` para manejar JWT
- [x] Crear `jwt.interceptor.ts` para agregar token
- [x] Crear `auth-error.interceptor.ts` para manejar 401
- [x] Registrar interceptors en `app.config.ts`
- [x] Actualizar `auth.guard.ts` para validar token
- [x] Agregar constantes de storage
- [x] Verificar que compile correctamente
- [x] Mantener compatibilidad con datos legacy

---

## 🎯 Próximos Pasos

### Fase 3: GitHub Actions (0.5 horas)

- [ ] Agregar `JWT_SECRET` en GitHub Secrets
- [ ] Actualizar workflow para pasar env variables
- [ ] Actualizar `afterPack.js` para crear `.env`
- [ ] Test manual del workflow

### Fase 4: Testing (0.5 horas)

- [ ] Test de login local
- [ ] Test de rutas protegidas
- [ ] Test de expiración de token
- [ ] Test de interceptors
- [ ] Test de build en GitHub Actions
- [ ] Test de app empaquetada

---

## 🎓 Notas Importantes

1. **Token en LocalStorage:**
   - El token JWT se guarda en localStorage
   - Es accesible desde JavaScript (XSS risk)
   - Alternativa: httpOnly cookies (requiere cambios en backend)

2. **Expiración:**
   - El token expira en 12 horas (configurable en backend)
   - Se valida automáticamente en cada request
   - Si expira, se limpia la sesión y redirige a login

3. **Interceptors:**
   - Se ejecutan en orden: JWT → Auth Error → Error
   - JWT agrega el token
   - Auth Error maneja 401/403
   - Error maneja otros errores

4. **Guards:**
   - `authGuard` valida token antes de activar ruta
   - `guestGuard` redirige si ya está logueado
   - Ambos usan `AuthService.isUserLoggedIn()`

---

## 🎉 Conclusión

La Fase 2 está **completada exitosamente**. El frontend ahora tiene:

- ✅ Integración completa con JWT
- ✅ Interceptors para agregar token automáticamente
- ✅ Manejo de errores de autenticación
- ✅ Validación de expiración de token
- ✅ Compilación exitosa
- ✅ Incremento mínimo de bundle size (+0.5%)

**Próximo paso:** Implementar Fase 3 (GitHub Actions) para configurar el build con JWT.
