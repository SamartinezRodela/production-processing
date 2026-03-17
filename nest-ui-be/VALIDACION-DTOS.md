# 🛡️ Validación de DTOs - Guía Completa

## ✅ Implementación Completada

La validación de DTOs está ahora activa en toda la API. Esto previene:

- ❌ Datos inválidos
- ❌ Inyección de código
- ❌ Errores en runtime
- ❌ Datos inconsistentes

---

## 📋 DTOs Implementados

### 1. **CreateFacilityDto**

```typescript
{
  name: string; // Requerido, 2-50 caracteres, solo letras/números/espacios/-/_
}
```

### 2. **UpdateFacilityDto**

```typescript
{
  name: string; // Requerido, 2-50 caracteres, solo letras/números/espacios/-/_
}
```

### 3. **CreateOrderDto**

```typescript
{
  name: string;                                    // Requerido, 2-100 caracteres
  facilityId?: string;                             // Opcional
  status?: 'active' | 'inactive' | 'completed';    // Opcional, enum
}
```

### 4. **UpdateOrderDto**

```typescript
{
  name?: string;                                   // Opcional, 2-100 caracteres
  facilityId?: string;                             // Opcional
  status?: 'active' | 'inactive' | 'completed';    // Opcional, enum
}
```

### 5. **UpdateSettingsDto**

```typescript
{
  selectedFacilityId?: string;
  basePath?: string;                               // 3-500 caracteres
  outputPath?: string;                             // 3-500 caracteres
  os?: 'windows' | 'macos';                        // Enum
  theme?: 'light' | 'dark';                        // Enum
  autoSave?: boolean;
  notifications?: boolean;
}
```

### 6. **ValidatePathDto**

```typescript
{
  path: string; // Requerido, 3-500 caracteres
  type: 'read' | 'write' | 'both'; // Requerido, enum
}
```

---

## 🧪 Ejemplos de Pruebas

### **Prueba 1: Crear Facility Válida** ✅

```bash
curl -X POST http://localhost:3000/facilities \
  -H "Content-Type: application/json" \
  -d '{"name": "Nueva Facility"}'
```

**Respuesta:**

```json
{
  "id": "4",
  "name": "Nueva Facility",
  "createdAt": "2026-03-13T...",
  "updatedAt": "2026-03-13T..."
}
```

---

### **Prueba 2: Crear Facility Inválida (nombre muy corto)** ❌

```bash
curl -X POST http://localhost:3000/facilities \
  -H "Content-Type: application/json" \
  -d '{"name": "A"}'
```

**Respuesta:**

```json
{
  "statusCode": 400,
  "message": ["Name must be at least 2 characters long"],
  "error": "Bad Request"
}
```

---

### **Prueba 3: Crear Facility con Caracteres Inválidos** ❌

```bash
curl -X POST http://localhost:3000/facilities \
  -H "Content-Type: application/json" \
  -d '{"name": "Facility@#$%"}'
```

**Respuesta:**

```json
{
  "statusCode": 400,
  "message": [
    "Name can only contain letters, numbers, spaces, hyphens and underscores"
  ],
  "error": "Bad Request"
}
```

---

### **Prueba 4: Crear Facility sin Nombre** ❌

```bash
curl -X POST http://localhost:3000/facilities \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Respuesta:**

```json
{
  "statusCode": 400,
  "message": [
    "Name must be a string",
    "Name is required",
    "Name must be at least 2 characters long",
    "Name must not exceed 50 characters",
    "Name can only contain letters, numbers, spaces, hyphens and underscores"
  ],
  "error": "Bad Request"
}
```

---

### **Prueba 5: Crear Order Válida** ✅

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nueva Order",
    "facilityId": "1",
    "status": "active"
  }'
```

**Respuesta:**

```json
{
  "id": "3",
  "name": "Nueva Order",
  "facilityId": "1",
  "status": "active",
  "createdAt": "2026-03-13T...",
  "updatedAt": "2026-03-13T..."
}
```

---

### **Prueba 6: Crear Order con Status Inválido** ❌

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nueva Order",
    "status": "invalid_status"
  }'
```

**Respuesta:**

```json
{
  "statusCode": 400,
  "message": ["Status must be one of: active, inactive, completed"],
  "error": "Bad Request"
}
```

---

### **Prueba 7: Actualizar Settings Válido** ✅

```bash
curl -X PUT http://localhost:3000/settings \
  -H "Content-Type: application/json" \
  -d '{
    "basePath": "C:\\Production\\Files",
    "outputPath": "C:\\Production\\Output",
    "theme": "dark"
  }'
```

**Respuesta:**

```json
{
  "selectedFacilityId": "1",
  "basePath": "C:\\Production\\Files",
  "outputPath": "C:\\Production\\Output",
  "os": "windows",
  "theme": "dark",
  "autoSave": false,
  "notifications": true
}
```

---

### **Prueba 8: Actualizar Settings con Theme Inválido** ❌

```bash
curl -X PUT http://localhost:3000/settings \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "blue"
  }'
```

**Respuesta:**

```json
{
  "statusCode": 400,
  "message": ["Theme must be one of: light, dark"],
  "error": "Bad Request"
}
```

---

### **Prueba 9: Validar Path Válido** ✅

```bash
curl -X POST http://localhost:3000/settings/validate-path \
  -H "Content-Type: application/json" \
  -d '{
    "path": "C:\\Production\\Files",
    "type": "read"
  }'
```

**Respuesta:**

```json
{
  "valid": true,
  "exists": true,
  "canRead": true,
  "canWrite": true
}
```

---

### **Prueba 10: Validar Path sin Type** ❌

```bash
curl -X POST http://localhost:3000/settings/validate-path \
  -H "Content-Type: application/json" \
  -d '{
    "path": "C:\\Production\\Files"
  }'
```

**Respuesta:**

```json
{
  "statusCode": 400,
  "message": ["Type must be one of: read, write, both"],
  "error": "Bad Request"
}
```

---

### **Prueba 11: Enviar Propiedades Extra (Whitelist)** ❌

```bash
curl -X POST http://localhost:3000/facilities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Facility",
    "extraField": "This should be rejected"
  }'
```

**Respuesta:**

```json
{
  "statusCode": 400,
  "message": ["property extraField should not exist"],
  "error": "Bad Request"
}
```

---

## 🔧 Configuración de ValidationPipe

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // ✅ Elimina propiedades no definidas
    forbidNonWhitelisted: true, // ✅ Lanza error si hay propiedades extra
    transform: true, // ✅ Transforma tipos automáticamente
    transformOptions: {
      enableImplicitConversion: true, // ✅ Convierte tipos implícitamente
    },
  }),
);
```

---

## 📚 Decoradores Usados

### **Validación de Strings**

- `@IsString()` - Verifica que sea string
- `@IsNotEmpty()` - No puede estar vacío
- `@MinLength(n)` - Longitud mínima
- `@MaxLength(n)` - Longitud máxima
- `@Matches(regex)` - Debe coincidir con regex

### **Validación de Enums**

- `@IsEnum(enum)` - Debe ser uno de los valores del enum

### **Validación de Booleanos**

- `@IsBoolean()` - Debe ser true o false

### **Opcionales**

- `@IsOptional()` - El campo es opcional

---

## 🎯 Beneficios

### **Antes (Sin Validación)**

```typescript
// ❌ Cualquier dato pasa
POST /facilities
{
  "name": "",                    // Vacío
  "extraField": "hack",          // Campo extra
  "name": 123                    // Tipo incorrecto
}
// Se guarda en la base de datos ❌
```

### **Ahora (Con Validación)**

```typescript
// ✅ Solo datos válidos pasan
POST /facilities
{
  "name": "",                    // ❌ Error: Name is required
  "extraField": "hack",          // ❌ Error: property should not exist
  "name": 123                    // ❌ Error: Name must be a string
}
// No se guarda, retorna error 400 ✅
```

---

## 🚀 Próximos Pasos

1. ✅ Validación de DTOs implementada
2. ⏭️ Lazy loading en frontend
3. ⏭️ HTTP interceptor para errores
4. ⏭️ Corregir warnings de Tailwind

---

## 📖 Recursos

- [class-validator Documentation](https://github.com/typestack/class-validator)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [class-transformer Documentation](https://github.com/typestack/class-transformer)

---

**Tiempo de implementación:** 1.5 horas
**Dificultad:** Fácil
**Impacto:** Alto (previene muchos errores)
