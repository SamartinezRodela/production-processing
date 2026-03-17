# ✅ JWT Fase 1: Backend - COMPLETADA

**Fecha:** 13 de Marzo, 2026  
**Duración:** ~1.5 horas  
**Estado:** ✅ Completado y compilando correctamente

---

## 📦 Dependencias Instaladas

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

**Paquetes agregados:**

- `@nestjs/jwt` - Módulo JWT para NestJS
- `@nestjs/passport` - Integración de Passport con NestJS
- `passport` - Framework de autenticación
- `passport-jwt` - Estrategia JWT para Passport
- `bcrypt` - Hash de contraseñas
- `@types/passport-jwt` - Tipos TypeScript
- `@types/bcrypt` - Tipos TypeScript

---

## 📁 Archivos Creados

### DTOs (Data Transfer Objects)

1. **`src/auth/dto/login.dto.ts`**
   - Validación de credenciales de login
   - Username y password requeridos
   - Password mínimo 6 caracteres

2. **`src/auth/dto/register.dto.ts`**
   - Validación de registro de usuarios
   - Username: 3-20 caracteres, solo letras, números y guiones bajos
   - Password: 6-50 caracteres
   - Role: 'admin' o 'user'

### Entidades

3. **`src/auth/entities/user.entity.ts`**
   - Interface `User` con passwordHash
   - Interface `UserResponse` sin passwordHash (para respuestas)

### Estrategia y Guards

4. **`src/auth/jwt.strategy.ts`**
   - Estrategia de validación JWT
   - Extrae token del header Authorization
   - Valida que el usuario existe
   - Agrega datos del usuario a `request.user`

5. **`src/auth/jwt-auth.guard.ts`**
   - Guard para proteger rutas
   - Valida token JWT
   - Lanza UnauthorizedException si el token es inválido

### Configuración

6. **`.env`**
   - Variables de entorno para desarrollo
   - JWT_SECRET
   - JWT_EXPIRATION
   - NODE_ENV
   - PORT

7. **`.env.example`**
   - Plantilla de variables de entorno
   - Documentación para otros desarrolladores

---

## 🔄 Archivos Modificados

### 1. `src/auth/auth.service.ts`

**Antes:** Vacío  
**Después:** Servicio completo con:

- ✅ Gestión de usuarios en archivo JSON (`data/users.json`)
- ✅ Hash de contraseñas con bcrypt (10 rounds)
- ✅ Generación de tokens JWT
- ✅ Validación de credenciales
- ✅ Creación automática de usuario admin por defecto
- ✅ Métodos: login, register, validateUser, findUserById, changePassword

**Usuario admin por defecto:**

- Username: `admin`
- Password: `admin123`
- Role: `admin`

### 2. `src/auth/auth.controller.ts`

**Antes:** Login básico con credenciales hardcodeadas  
**Después:** Controlador completo con:

- ✅ `POST /auth/login` - Login con JWT real
- ✅ `POST /auth/register` - Registro de usuarios (protegido)
- ✅ `GET /auth/me` - Obtener perfil del usuario actual (protegido)
- ✅ `POST /auth/change-password` - Cambiar contraseña (protegido)

### 3. `src/auth/auth.module.ts`

**Antes:** Módulo básico  
**Después:** Módulo configurado con:

- ✅ PassportModule importado
- ✅ JwtModule configurado con secret y expiración
- ✅ JwtStrategy registrado como provider
- ✅ AuthService y JwtModule exportados

### 4. Controladores Protegidos

Se agregó `@UseGuards(JwtAuthGuard)` a:

- ✅ `src/facilities/facilities.controller.ts`
- ✅ `src/orders/orders.controller.ts`
- ✅ `src/settings/settings.controller.ts`

**Ahora todas las rutas de estos controladores requieren autenticación JWT.**

---

## 🔐 Seguridad Implementada

### Hash de Contraseñas

```typescript
// Contraseñas hasheadas con bcrypt (10 rounds)
const passwordHash = await bcrypt.hash(password, 10);
```

### Tokens JWT

```typescript
// Token firmado con secret
const payload = {
  sub: user.id,
  username: user.username,
  role: user.role,
};
const accessToken = this.jwtService.sign(payload);
```

### Validación de Tokens

```typescript
// Estrategia JWT valida automáticamente
// Token debe estar en header: Authorization: Bearer <token>
```

---

## 📊 Endpoints Disponibles

### Públicos (sin autenticación)

```
POST /auth/login
Body: { username: string, password: string }
Response: { success: true, accessToken: string, user: {...} }
```

### Protegidos (requieren JWT)

```
GET /auth/me
Header: Authorization: Bearer <token>
Response: { success: true, user: {...} }

POST /auth/register
Header: Authorization: Bearer <token>
Body: { username: string, password: string, role: 'admin' | 'user' }
Response: { success: true, user: {...} }

POST /auth/change-password
Header: Authorization: Bearer <token>
Body: { oldPassword: string, newPassword: string }
Response: { success: true, message: string }

GET /facilities
GET /orders
GET /settings
... (todas las rutas de estos controladores)
```

---

## 🧪 Cómo Probar

### 1. Iniciar el servidor

```bash
cd nest-ui-be
npm run start:dev
```

### 2. Login (obtener token)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Respuesta:**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "admin",
    "role": "admin",
    "createdAt": "2026-03-13T..."
  }
}
```

### 3. Usar el token en requests protegidos

```bash
curl -X GET http://localhost:3000/facilities \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Obtener perfil actual

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📂 Estructura de Archivos

```
nest-ui-be/
├── src/
│   └── auth/
│       ├── dto/
│       │   ├── login.dto.ts          ✅ NUEVO
│       │   └── register.dto.ts       ✅ NUEVO
│       ├── entities/
│       │   └── user.entity.ts        ✅ NUEVO
│       ├── auth.controller.ts        🔄 MODIFICADO
│       ├── auth.service.ts           🔄 MODIFICADO
│       ├── auth.module.ts            🔄 MODIFICADO
│       ├── jwt.strategy.ts           ✅ NUEVO
│       └── jwt-auth.guard.ts         ✅ NUEVO
├── data/
│   └── users.json                    ✅ AUTO-GENERADO
├── .env                              ✅ NUEVO
└── .env.example                      ✅ NUEVO
```

---

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRATION=12h
NODE_ENV=development
PORT=3000
```

### Usuario Admin por Defecto

- **Username:** admin
- **Password:** admin123
- **Role:** admin
- **Creado automáticamente** en el primer arranque

---

## ✅ Checklist de Fase 1

- [x] Instalar dependencias JWT
- [x] Crear `jwt.strategy.ts`
- [x] Crear `jwt-auth.guard.ts`
- [x] Crear DTOs de login y register
- [x] Implementar `auth.service.ts` con bcrypt
- [x] Actualizar `auth.controller.ts`
- [x] Configurar `auth.module.ts` con JwtModule
- [x] Proteger rutas con `@UseGuards(JwtAuthGuard)`
- [x] Crear usuario admin por defecto
- [x] Agregar variables de entorno (.env)
- [x] Verificar que compile correctamente

---

## 🎯 Próximos Pasos

### Fase 2: Frontend (0.5-1 hora)

- [ ] Actualizar `auth.service.ts` para manejar JWT
- [ ] Crear `jwt.interceptor.ts` para agregar token a requests
- [ ] Crear `auth-error.interceptor.ts` para manejar 401
- [ ] Registrar interceptors en `app.config.ts`

### Fase 3: GitHub Actions (0.5 horas)

- [ ] Agregar `JWT_SECRET` en GitHub Secrets
- [ ] Actualizar workflow para pasar env variables
- [ ] Actualizar `afterPack.js` para crear `.env`

### Fase 4: Testing (0.5 horas)

- [ ] Test de login local
- [ ] Test de rutas protegidas
- [ ] Test de expiración de token
- [ ] Test de build en GitHub Actions

---

## 🎓 Notas Importantes

1. **Seguridad:**
   - Las contraseñas se hashean con bcrypt (10 rounds)
   - Los tokens JWT expiran en 12 horas (configurable)
   - El JWT_SECRET debe cambiarse en producción

2. **Base de Datos:**
   - Los usuarios se guardan en `data/users.json`
   - El archivo se crea automáticamente
   - El usuario admin se crea en el primer arranque

3. **Rutas Protegidas:**
   - Todas las rutas de facilities, orders y settings requieren JWT
   - El endpoint `/auth/login` es público
   - El endpoint `/auth/register` está protegido (solo admins)

4. **Token JWT:**
   - Se envía en el header: `Authorization: Bearer <token>`
   - Contiene: user id, username, role
   - Expira en 12 horas (configurable)

---

## 🎉 Conclusión

La Fase 1 está **completada exitosamente**. El backend ahora tiene:

- ✅ Autenticación JWT real
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Rutas protegidas
- ✅ Usuario admin por defecto
- ✅ Compilación exitosa

**Próximo paso:** Implementar Fase 2 (Frontend) para integrar JWT en el cliente.
