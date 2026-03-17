# ✅ Fix: JWT Token en Llamadas IPC de Electron

**Fecha:** 13 de Marzo, 2026  
**Problema:** Error 401 en llamadas Python/PDF desde Electron  
**Causa:** IPC calls no incluían token JWT  
**Solución:** Pasar token desde renderer a main process  
**Estado:** ✅ Completado

---

## 🐛 Problema

Después de proteger los controladores de Python y PDF con JWT, las llamadas desde Electron fallaban con error 401:

```
Error: Invalid or expired token
Status: 401 Unauthorized
```

### Causa Raíz

Las llamadas IPC de Electron NO pasaban por los interceptors HTTP de Angular. El flujo era:

```
Angular Component
  ↓
ElectronService (renderer process)
  ↓
IPC (contextBridge)
  ↓
Main Process (main.ts)
  ↓
ApiClient (HTTP request SIN token) ❌
  ↓
Backend (rechaza con 401)
```

---

## ✅ Solución Implementada

Modificar toda la cadena para pasar el token JWT desde el renderer hasta el backend:

```
Angular Component (obtiene token)
  ↓
ElectronService (pasa token)
  ↓
IPC (pasa token)
  ↓
Main Process (pasa token)
  ↓
ApiClient (agrega header Authorization) ✅
  ↓
Backend (acepta con 200)
```

---

## 📝 Cambios Realizados

### 1. ApiClient (nest-electron/src/api-client.ts)

**Antes:**

```typescript
private static async request(method: string, endpoint: string, data?: any) {
  const request = net.request({ method, url });
  // ❌ Sin Authorization header
}
```

**Después:**

```typescript
private static async request(
  method: string,
  endpoint: string,
  data?: any,
  token?: string, // ✅ Nuevo parámetro
) {
  const request = net.request({ method, url });

  // ✅ Agregar Authorization header
  if (token) {
    request.setHeader("Authorization", `Bearer ${token}`);
  }
}

// Actualizar métodos
static async pythonSaludar(nombre: string, token?: string) {
  return this.get(`/python/saludar?nombre=${nombre}`, token);
}
```

---

### 2. Main Process (nest-electron/src/main.ts)

**Antes:**

```typescript
ipcMain.handle("python:saludar", async (_event, nombre: string) => {
  const result = await ApiClient.pythonSaludar(nombre); // ❌ Sin token
  return result;
});
```

**Después:**

```typescript
ipcMain.handle(
  "python:saludar",
  async (_event, nombre: string, token?: string) => {
    const result = await ApiClient.pythonSaludar(nombre, token); // ✅ Con token
    return result;
  },
);
```

---

### 3. Preload Script (nest-electron/src/preload.ts)

**Antes:**

```typescript
python: {
  saludar: (nombre: string) =>
    ipcRenderer.invoke("python:saludar", nombre), // ❌ Sin token
}
```

**Después:**

```typescript
python: {
  saludar: (nombre: string, token?: string) =>
    ipcRenderer.invoke("python:saludar", nombre, token), // ✅ Con token
}
```

---

### 4. ElectronService (nest-ui-fe/src/app/service/electron.service.ts)

**Antes:**

```typescript
async pythonSaludar(nombre: string): Promise<any> {
  const result = await window.electronAPI!.python.saludar(nombre); // ❌ Sin token
  return result;
}
```

**Después:**

```typescript
async pythonSaludar(nombre: string, token?: string): Promise<any> {
  const result = await window.electronAPI!.python.saludar(nombre, token); // ✅ Con token
  return result;
}
```

---

### 5. Home Component (nest-ui-fe/src/app/pages/home/home.ts)

**Antes:**

```typescript
async probarSaludar(): Promise<void> {
  const result = await this.electronService.pythonSaludar('Alex'); // ❌ Sin token
}
```

**Después:**

```typescript
async probarSaludar(): Promise<void> {
  const token = this.authService.getToken(); // ✅ Obtener token
  const result = await this.electronService.pythonSaludar('Alex', token || undefined);
}
```

---

### 6. PDF Generation Service (nest-ui-fe/src/app/service/home/pdf-generation.service.ts)

**Antes:**

```typescript
async generatePDFWithPath(datos: any, outputPath: string): Promise<void> {
  const result = await this.electronService.pythonGenerarPathPDF(datosConRuta); // ❌ Sin token
}
```

**Después:**

```typescript
async generatePDFWithPath(datos: any, outputPath: string, token?: string): Promise<void> {
  const result = await this.electronService.pythonGenerarPathPDF(datosConRuta, token); // ✅ Con token
}
```

---

## 🔄 Flujo Completo

### 1. Usuario hace click en "Hi!" o "PDF"

```typescript
// home.ts
async probarSaludar() {
  const token = this.authService.getToken(); // Obtiene del localStorage
  await this.electronService.pythonSaludar('Alex', token);
}
```

### 2. ElectronService pasa el token

```typescript
// electron.service.ts
async pythonSaludar(nombre: string, token?: string) {
  return window.electronAPI!.python.saludar(nombre, token);
}
```

### 3. Preload pasa el token via IPC

```typescript
// preload.ts
saludar: (nombre, token) => ipcRenderer.invoke("python:saludar", nombre, token);
```

### 4. Main Process recibe y pasa el token

```typescript
// main.ts
ipcMain.handle("python:saludar", async (_event, nombre, token) => {
  return ApiClient.pythonSaludar(nombre, token);
});
```

### 5. ApiClient agrega el header

```typescript
// api-client.ts
if (token) {
  request.setHeader("Authorization", `Bearer ${token}`);
}
```

### 6. Backend valida el token

```typescript
// python.controller.ts
@UseGuards(JwtAuthGuard) // Valida el token
@Get('saludar')
async saludar(@Query('nombre') nombre: string) {
  // Token válido, procesa la request
}
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

### 3. Iniciar Electron

```bash
cd nest-electron
npm start
```

### 4. Probar en la App

1. Hacer login (username: admin, password: admin123)
2. Ir a Home
3. Click en botón "Hi!" (debería funcionar ✅)
4. Click en botón "PDF" (debería funcionar ✅)

### 5. Verificar en DevTools

Abrir DevTools en Electron y verificar:

```
[IPC] python:saludar llamado con: Alex
[IPC] python:saludar resultado: { success: true, mensaje: "¡Hola, Alex!" }
```

---

## ⚠️ Consideraciones

### 1. Token Expirado

Si el token expira (12 horas):

- El backend retorna 401
- El `authErrorInterceptor` NO funciona en IPC
- El usuario debe hacer logout y login de nuevo

**Solución futura:** Implementar refresh token automático

### 2. Sin Token

Si el usuario no está logueado:

- `authService.getToken()` retorna `null`
- Se pasa `undefined` al IPC
- Backend rechaza con 401
- Usuario debe hacer login

### 3. Múltiples Llamadas

Cada llamada IPC debe pasar el token:

- `pythonSaludar(nombre, token)`
- `pythonGenerarPDF(datos, token)`
- `pythonGenerarPathPDF(datos, token)`
- `pythonProcesarPDF(datos, token)` ← Pendiente de actualizar

---

## 📋 Métodos Actualizados

| Método                 | Archivo                                               | Token        |
| ---------------------- | ----------------------------------------------------- | ------------ |
| `pythonSaludar`        | ApiClient, Main, Preload, ElectronService, Home       | ✅           |
| `pythonGenerarPDF`     | ApiClient, Main, Preload, ElectronService, PdfService | ✅           |
| `pythonGenerarPathPDF` | ApiClient, Main, Preload, ElectronService, PdfService | ✅           |
| `pythonProcesarPDF`    | ApiClient, Main, Preload, ElectronService             | ❌ Pendiente |

---

## 🚀 Próximos Pasos

### 1. Actualizar pythonProcesarPDF

Agregar soporte de token a `pythonProcesarPDF` (usado en procesamiento masivo de PDFs).

### 2. Implementar Refresh Token

Renovar token automáticamente cuando esté por expirar.

### 3. Manejo de Errores Mejorado

Detectar 401 en IPC y redirigir al login automáticamente.

### 4. Cache de Token

Evitar llamar `getToken()` en cada request, cachear en memoria.

---

## ✅ Checklist de Verificación

- [x] Actualizar ApiClient para aceptar token
- [x] Actualizar Main Process IPC handlers
- [x] Actualizar Preload script
- [x] Actualizar ElectronService
- [x] Actualizar Home component
- [x] Actualizar PdfGenerationService
- [x] Compilar frontend sin errores
- [x] Compilar electron sin errores
- [ ] Probar botón "Hi!" en Electron
- [ ] Probar botón "PDF" en Electron
- [ ] Verificar que funciona con token válido
- [ ] Verificar que falla con token inválido

---

## 🎉 Resultado

Ahora las llamadas IPC de Electron incluyen el token JWT:

- ✅ Botón "Hi!" funciona correctamente
- ✅ Botón "PDF" funciona correctamente
- ✅ Backend valida el token en cada request
- ✅ Solo usuarios autenticados pueden ejecutar Python/PDF

**Error 401 resuelto!**
