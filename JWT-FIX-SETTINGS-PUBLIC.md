# 🔧 Fix: Settings Default Route - Ruta Pública

**Fecha:** 13 de Marzo, 2026  
**Problema:** Error 401 al cargar `/settings/default` antes del login  
**Solución:** Hacer la ruta `/settings/default` pública  
**Estado:** ✅ Resuelto

---

## 🐛 Problema

Después de implementar JWT, la aplicación mostraba el siguiente error:

```
GET http://localhost:3000/settings/default 401 (Unauthorized)
```

### Causa

El guard `@UseGuards(JwtAuthGuard)` estaba aplicado a nivel de controlador en `SettingsController`, protegiendo TODAS las rutas, incluyendo `/settings/default`.

```typescript
@Controller("settings")
@UseGuards(JwtAuthGuard) // ❌ Protege TODAS las rutas
export class SettingsController {
  // ...
  @Get("default")
  getDefaultSettings() {
    return this.settingsService.getDefaultSettings();
  }
}
```

### Por qué es un problema

La ruta `/settings/default` se llama desde el frontend ANTES del login para obtener la configuración inicial de la aplicación (tema, idioma, etc.). Si está protegida, el usuario no puede ni siquiera llegar a la pantalla de login.

---

## ✅ Solución

Mover el guard `@UseGuards(JwtAuthGuard)` del nivel de controlador al nivel de método, dejando `/settings/default` como ruta pública.

### Antes

```typescript
@Controller("settings")
@UseGuards(JwtAuthGuard) // ❌ Protege TODAS las rutas
export class SettingsController {
  @Get("default")
  getDefaultSettings() {
    return this.settingsService.getDefaultSettings();
  }

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }
  // ...
}
```

### Después

```typescript
@Controller("settings")
export class SettingsController {
  // Ruta pública - necesaria antes del login
  @Get("default")
  getDefaultSettings() {
    return this.settingsService.getDefaultSettings();
  }

  // Rutas protegidas
  @UseGuards(JwtAuthGuard)
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard)
  @Get("database-info")
  getDatabaseInfo() {
    return this.databaseService.getDatabaseInfo();
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(updateSettingsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("reset")
  resetToDefault() {
    return this.settingsService.resetToDefault();
  }

  @UseGuards(JwtAuthGuard)
  @Post("validate-path")
  validatePath(@Body() validatePathDto: ValidatePathDto) {
    return this.settingsService.validatePath(
      validatePathDto.path,
      validatePathDto.type,
    );
  }
}
```

---

## 📊 Rutas de Settings

| Ruta                      | Método | Protegida | Razón                       |
| ------------------------- | ------ | --------- | --------------------------- |
| `/settings/default`       | GET    | ❌ No     | Necesaria antes del login   |
| `/settings`               | GET    | ✅ Sí     | Datos sensibles del usuario |
| `/settings/database-info` | GET    | ✅ Sí     | Información del sistema     |
| `/settings`               | PUT    | ✅ Sí     | Modificar configuración     |
| `/settings/reset`         | POST   | ✅ Sí     | Resetear configuración      |
| `/settings/validate-path` | POST   | ✅ Sí     | Validar paths del sistema   |

---

## 🔐 Seguridad

### ¿Es seguro hacer `/settings/default` pública?

**Sí**, porque:

1. **Solo retorna configuración por defecto:** No contiene datos sensibles del usuario
2. **No modifica nada:** Es solo lectura (GET)
3. **Datos genéricos:** Tema, idioma, configuración UI básica
4. **Necesaria para la app:** Sin ella, la app no puede ni cargar

### Datos que retorna `/settings/default`

```json
{
  "theme": "light",
  "language": "en",
  "defaultPaths": {
    "input": "",
    "output": "",
    "template": ""
  },
  "uiSettings": {
    "showNotifications": true,
    "autoSave": true
  }
}
```

**Ninguno de estos datos es sensible.**

---

## 🧪 Cómo Probar

### 1. Sin Token (Público)

```bash
# Debería funcionar sin token
curl http://localhost:3000/settings/default
```

**Respuesta esperada:** 200 OK con configuración por defecto

### 2. Con Token (Protegido)

```bash
# Obtener token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.accessToken')

# Usar token para ruta protegida
curl http://localhost:3000/settings \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:** 200 OK con configuración del usuario

### 3. Sin Token en Ruta Protegida

```bash
# Debería fallar con 401
curl http://localhost:3000/settings
```

**Respuesta esperada:** 401 Unauthorized

---

## 🎯 Otras Rutas Públicas

### Rutas que NO requieren autenticación

| Ruta                | Controlador | Razón                           |
| ------------------- | ----------- | ------------------------------- |
| `/auth/login`       | Auth        | Necesaria para obtener token    |
| `/settings/default` | Settings    | Configuración inicial de la app |
| `/` (root)          | App         | Health check                    |

### Rutas que SÍ requieren autenticación

| Ruta                  | Controlador | Razón                                 |
| --------------------- | ----------- | ------------------------------------- |
| `/facilities/*`       | Facilities  | Datos sensibles del negocio           |
| `/orders/*`           | Orders      | Datos sensibles del negocio           |
| `/settings` (GET/PUT) | Settings    | Configuración del usuario             |
| `/auth/register`      | Auth        | Solo admins pueden crear usuarios     |
| `/auth/me`            | Auth        | Perfil del usuario actual             |
| `/python/*`           | Python      | Ejecución de scripts (sin protección) |
| `/pdf/*`              | PDF         | Generación de PDFs (sin protección)   |

---

## ⚠️ Nota sobre Python y PDF

Las rutas de `/python/*` y `/pdf/*` actualmente NO están protegidas. Esto podría ser un riesgo de seguridad si la aplicación está expuesta públicamente.

### Recomendación Futura

Proteger estas rutas también:

```typescript
@Controller("python")
@UseGuards(JwtAuthGuard) // Proteger todas las rutas de Python
export class PythonController {
  // ...
}

@Controller("pdf")
@UseGuards(JwtAuthGuard) // Proteger todas las rutas de PDF
export class PdfController {
  // ...
}
```

**Razón:** Estas rutas ejecutan código Python y generan archivos, lo cual podría ser abusado si la app está expuesta públicamente.

---

## 🎓 Lecciones Aprendidas

### 1. Guards a Nivel de Controlador vs Método

**Nivel de Controlador:**

```typescript
@Controller("settings")
@UseGuards(JwtAuthGuard) // Protege TODAS las rutas
export class SettingsController {}
```

**Ventaja:** Menos código, más simple  
**Desventaja:** No permite rutas públicas

**Nivel de Método:**

```typescript
@Controller("settings")
export class SettingsController {
  @Get("public")
  publicRoute() {} // Pública

  @UseGuards(JwtAuthGuard)
  @Get("protected")
  protectedRoute() {} // Protegida
}
```

**Ventaja:** Flexibilidad para rutas públicas  
**Desventaja:** Más código, más verboso

### 2. Orden de Decoradores

El orden importa:

```typescript
// ✅ Correcto
@UseGuards(JwtAuthGuard)
@Get('route')
method() {}

// ❌ Incorrecto (puede no funcionar)
@Get('route')
@UseGuards(JwtAuthGuard)
method() {}
```

### 3. Testing de Rutas Públicas

Siempre probar que las rutas públicas funcionan SIN token:

```bash
# Debe funcionar
curl http://localhost:3000/settings/default

# Debe fallar con 401
curl http://localhost:3000/settings
```

---

## ✅ Checklist de Verificación

- [x] Ruta `/settings/default` es pública
- [x] Otras rutas de `/settings` están protegidas
- [x] Backend compila correctamente
- [x] Probar ruta pública sin token (debe funcionar)
- [x] Probar ruta protegida sin token (debe fallar con 401)
- [x] Probar ruta protegida con token (debe funcionar)
- [x] Frontend carga correctamente antes del login

---

## 🎉 Resultado

Ahora la aplicación funciona correctamente:

1. ✅ Usuario puede cargar la app sin estar logueado
2. ✅ `/settings/default` retorna configuración inicial
3. ✅ Rutas protegidas requieren token JWT
4. ✅ Login funciona correctamente
5. ✅ Después del login, todas las rutas funcionan

**Error 401 resuelto!**
