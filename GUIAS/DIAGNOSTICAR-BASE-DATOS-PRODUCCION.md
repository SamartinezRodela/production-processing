# Diagnosticar Base de Datos en Producción

## Problema Reportado

La base de datos no se está actualizando en producción cuando se hacen cambios (agregar facilities, orders, cambiar settings, etc.).

## Posibles Causas

1. **La app no detecta que está en producción** → Usa la ruta de desarrollo
2. **Los cambios SÍ se guardan pero en otra ubicación** → Estás mirando en el lugar equivocado
3. **Hay un error al guardar** → No se está mostrando en la UI
4. **Permisos de escritura** → Windows bloquea la escritura en %APPDATA%

## Dónde Debería Estar la Base de Datos

### Producción (Instalador)

```
Windows: C:\Users\[TuUsuario]\AppData\Roaming\Production Processing\database.json
Mac:     ~/Library/Application Support/Production Processing/database.json
```

### Desarrollo (npm run start)

```
Windows: C:\Projects\NEST-UI-V2\nest-ui-be\data\database.json
Mac:     /path/to/project/nest-ui-be/data/database.json
```

## Cómo Diagnosticar

### 1. Verificar Logs del Backend

**Abrir logs:**

1. Abrir la aplicación instalada
2. Menú → Ayuda → Ver Logs del Backend
3. O ir manualmente a: `C:\Users\[TuUsuario]\AppData\Roaming\Production Processing\backend.log`

**Buscar en los logs:**

```
=== INICIALIZANDO BASE DE DATOS ===
Ruta de base de datos: C:\Users\...\Production Processing\database.json
Archivo existe: true
Modo: PRODUCCIÓN
NODE_ENV: production
resourcesPath: C:\Program Files\Production Processing\resources
```

### 2. Usar el Endpoint de Diagnóstico

**Desde DevTools (F12):**

```javascript
// Obtener información de la base de datos
fetch("http://localhost:3000/settings/database-info")
  .then((r) => r.json())
  .then((data) => console.log(data));
```

**Respuesta esperada:**

```json
{
  "dbPath": "C:\\Users\\...\\Production Processing\\database.json",
  "exists": true,
  "size": 1234,
  "lastModified": "2026-03-10T15:30:00.000Z",
  "isProduction": true,
  "nodeEnv": "production",
  "resourcesPath": "C:\\Program Files\\Production Processing\\resources",
  "appData": "C:\\Users\\...\\AppData\\Roaming",
  "facilitiesCount": 3,
  "ordersCount": 2
}
```

### 3. Verificar que los Cambios se Guardan

**Hacer un cambio:**

1. Agregar una nueva facility
2. Verificar en DevTools que se guardó:

```javascript
fetch("http://localhost:3000/settings/database-info")
  .then((r) => r.json())
  .then((data) => {
    console.log("Facilities:", data.facilitiesCount);
    console.log("Last modified:", data.lastModified);
  });
```

**Buscar en logs:**

```
💾 Guardando base de datos en: C:\Users\...\database.json
✅ Base de datos guardada exitosamente
   Ruta: C:\Users\...\database.json
   Tamaño: 1456 bytes
```

### 4. Verificar el Archivo Manualmente

**Abrir el archivo:**

```powershell
# Windows PowerShell
notepad "$env:APPDATA\Production Processing\database.json"

# O abrir la carpeta
explorer "$env:APPDATA\Production Processing"
```

**Verificar contenido:**

```json
{
  "version": "1.0.0",
  "lastModified": "2026-03-10T15:30:00.000Z",
  "facilities": [
    { "id": "1", "name": "Reynosa", ... },
    { "id": "2", "name": "Merida", ... }
  ],
  "orders": [...],
  "settings": {...}
}
```

## Soluciones Según el Problema

### Problema 1: App No Detecta Producción

**Síntomas:**

- `isProduction: false` en el endpoint de diagnóstico
- `dbPath` apunta a la carpeta del proyecto

**Solución:**

- Verificar que `NODE_ENV=production` en `main.ts`
- Verificar que `RESOURCES_PATH` está definido
- Reinstalar la aplicación

### Problema 2: Cambios en Ubicación Incorrecta

**Síntomas:**

- `isProduction: true` pero `dbPath` no es el esperado
- Los cambios se guardan pero no donde esperas

**Solución:**

- Usar el `dbPath` del endpoint de diagnóstico
- Abrir esa ubicación específica
- Verificar que los cambios están ahí

### Problema 3: Error al Guardar

**Síntomas:**

- Logs muestran: `❌ Error guardando base de datos`
- `lastModified` no cambia después de hacer cambios

**Solución:**

- Verificar permisos de escritura en `%APPDATA%`
- Ejecutar la app como administrador (temporalmente)
- Verificar que no hay antivirus bloqueando

### Problema 4: Permisos de Windows

**Síntomas:**

- Error: `EACCES: permission denied`
- La carpeta existe pero no se puede escribir

**Solución:**

```powershell
# Dar permisos completos a la carpeta
$folder = "$env:APPDATA\Production Processing"
icacls $folder /grant "$env:USERNAME:(OI)(CI)F" /T
```

## Mejoras Implementadas

### Logging Detallado

Ahora el backend muestra:

- ✅ Ruta exacta de la base de datos
- ✅ Si está en modo producción o desarrollo
- ✅ Variables de entorno relevantes
- ✅ Confirmación de cada guardado
- ✅ Tamaño del archivo después de guardar

### Endpoint de Diagnóstico

Nuevo endpoint: `GET /settings/database-info`

Devuelve toda la información necesaria para diagnosticar:

- Ruta de la base de datos
- Si el archivo existe
- Tamaño del archivo
- Última modificación
- Modo (producción/desarrollo)
- Contadores de facilities y orders

## Testing

### Test 1: Verificar Ruta

```javascript
// En DevTools (F12)
fetch("http://localhost:3000/settings/database-info")
  .then((r) => r.json())
  .then((data) => {
    console.log("📂 Base de datos en:", data.dbPath);
    console.log("📊 Modo:", data.isProduction ? "PRODUCCIÓN" : "DESARROLLO");
  });
```

### Test 2: Verificar Guardado

```javascript
// 1. Obtener estado inicial
const before = await fetch("http://localhost:3000/settings/database-info").then(
  (r) => r.json(),
);
console.log("Antes:", before.lastModified);

// 2. Hacer un cambio (agregar facility, cambiar setting, etc.)

// 3. Verificar que cambió
const after = await fetch("http://localhost:3000/settings/database-info").then(
  (r) => r.json(),
);
console.log("Después:", after.lastModified);
console.log("¿Cambió?", before.lastModified !== after.lastModified);
```

### Test 3: Verificar Archivo

```powershell
# Windows
$dbPath = (Invoke-WebRequest -Uri "http://localhost:3000/settings/database-info" | ConvertFrom-Json).dbPath
notepad $dbPath
```

## Próximos Pasos

1. **Instalar el próximo build** de GitHub Actions
2. **Abrir DevTools** (F12)
3. **Ejecutar el endpoint de diagnóstico**
4. **Verificar la ruta** de la base de datos
5. **Hacer un cambio** (agregar facility)
6. **Verificar que se guardó** (revisar lastModified)
7. **Abrir el archivo** manualmente para confirmar

## Commits Relacionados

- `c057687` - feat: agregar logging detallado y endpoint de diagnóstico de base de datos

## Referencias

- Servicio de base de datos: `nest-ui-be/src/database/database.service.ts`
- Controlador de settings: `nest-ui-be/src/settings/settings.controller.ts`
- Main de Electron: `nest-electron/src/main.ts`
