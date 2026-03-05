# Guía: WebSockets para Sincronización en Tiempo Real

Esta guía explica cómo funciona el sistema de WebSockets implementado para sincronizar cambios en la base de datos JSON en tiempo real.

---

## 🎯 Problema Resuelto

Antes, si editabas manualmente el archivo `database.json`, los cambios NO se reflejaban en la aplicación hasta recargar.

Ahora, con WebSockets:

- ✅ Editas `database.json` manualmente
- ✅ La app detecta el cambio en < 1 segundo
- ✅ La UI se actualiza automáticamente
- ✅ Sin necesidad de recargar

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│ database.json (Archivo)                                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ File Watcher (chokidar)
┌─────────────────────────────────────────────────────────┐
│ DatabaseService (Backend)                               │
│ - Detecta cambios en el archivo                         │
│ - Recarga datos automáticamente                         │
│ - Notifica al Gateway                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ Emit Event
┌─────────────────────────────────────────────────────────┐
│ DatabaseGateway (WebSocket Server)                      │
│ - Emite evento "database-changed"                       │
│ - Broadcast a todos los clientes conectados             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ Socket.IO
┌─────────────────────────────────────────────────────────┐
│ WebSocketService (Frontend)                             │
│ - Escucha evento "database-changed"                     │
│ - Notifica a los servicios suscritos                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ Observable
┌─────────────────────────────────────────────────────────┐
│ FacilityManagementService / OrderManagementService      │
│ - Recarga datos desde el backend                        │
│ - Actualiza signals                                     │
│ - UI se actualiza automáticamente                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes Implementados

### 1. Backend - File Watcher

**Archivo:** `nest-ui-be/src/database/database.service.ts`

```typescript
import * as chokidar from 'chokidar';

private setupFileWatcher(): void {
  const watcher = chokidar.watch(this.dbPath, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on('change', () => {
    console.log('🔄 Database file changed, reloading...');
    this.loadDatabase();
    this.notifyDatabaseChanged();
  });
}
```

### 2. Backend - WebSocket Gateway

**Archivo:** `nest-ui-be/src/database/database.gateway.ts`

```typescript
@WebSocketGateway({
  cors: { origin: "*" },
})
export class DatabaseGateway {
  @WebSocketServer()
  server: Server;

  notifyDatabaseChanged(): void {
    this.server.emit("database-changed", {
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 3. Frontend - WebSocket Service

**Archivo:** `nest-ui-fe/src/app/service/websocket.service.ts`

```typescript
export class WebSocketService {
  private socket: Socket | null = null;
  private databaseChanged$ = new Subject<void>();

  async connect(): Promise<void> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    this.socket = io(apiUrl);

    this.socket.on("database-changed", () => {
      console.log("🔄 Database changed event received");
      this.databaseChanged$.next();
    });
  }

  onDatabaseChanged(): Observable<void> {
    return this.databaseChanged$.asObservable();
  }
}
```

### 4. Frontend - Servicios que Escuchan

**Archivo:** `nest-ui-fe/src/app/service/set-up/facility-management.service.ts`

```typescript
constructor(
  private facilitiesApi: FacilitiesApiService,
  private websocketService: WebSocketService,
) {
  this.loadFacilities();
  this.setupWebSocket();
}

private async setupWebSocket(): Promise<void> {
  await this.websocketService.connect();

  this.websocketService.onDatabaseChanged().subscribe(() => {
    console.log('🔄 Reloading facilities due to database change');
    this.loadFacilities();
  });
}
```

---

## 🧪 Cómo Probarlo

### Prueba 1: Editar JSON Manualmente

1. Abre la aplicación
2. Ve a Set-Up y observa las facilities actuales
3. Abre el archivo `database.json`:
   - Desarrollo: `nest-ui-be/data/database.json`
   - Producción: `%APPDATA%/Production Processing/database.json`
4. Edita el nombre de una facility:
   ```json
   {
     "id": "1",
     "name": "Reynosa EDITADO"
   }
   ```
5. Guarda el archivo
6. ✅ La UI se actualiza automáticamente en < 1 segundo

### Prueba 2: Agregar Facility Manualmente

1. Abre `database.json`
2. Agrega una nueva facility:
   ```json
   {
     "id": "4",
     "name": "Nueva Facility",
     "createdAt": "2026-03-03T19:00:00.000Z",
     "updatedAt": "2026-03-03T19:00:00.000Z"
   }
   ```
3. Guarda
4. ✅ Aparece inmediatamente en la UI

### Prueba 3: Eliminar Order Manualmente

1. Abre `database.json`
2. Elimina un order del array
3. Guarda
4. ✅ Desaparece de la UI automáticamente

---

## 📊 Ventajas vs Polling

| Aspecto            | Polling (Antes)     | WebSockets (Ahora)     |
| ------------------ | ------------------- | ---------------------- |
| Latencia           | 5 segundos          | < 1 segundo            |
| Uso de red         | Petición cada 5 seg | Solo cuando hay cambio |
| Carga del servidor | Alta (constante)    | Baja (solo eventos)    |
| Batería (móvil)    | Mayor consumo       | Menor consumo          |
| Escalabilidad      | Limitada            | Excelente              |

---

## 🔧 Configuración

### Cambiar Puerto WebSocket

Por defecto usa el mismo puerto que el backend. Si necesitas cambiarlo:

**Backend:**

```typescript
@WebSocketGateway({
  port: 3001, // Puerto específico
  cors: { origin: '*' },
})
```

**Frontend:**

```typescript
const apiUrl = await this.apiUrlService.getApiUrl();
this.socket = io(`${apiUrl}:3001`); // Puerto específico
```

### Deshabilitar WebSockets

Si prefieres volver a polling:

**Frontend:**

```typescript
// Comentar la configuración de WebSocket
// this.setupWebSocket();

// Agregar polling
setInterval(() => {
  this.loadFacilities();
}, 5000);
```

---

## 🐛 Solución de Problemas

### WebSocket no conecta

**Síntoma:** Cambios en JSON no se reflejan

**Solución:**

1. Verifica que el backend esté corriendo
2. Abre DevTools → Network → WS
3. Deberías ver conexión WebSocket activa
4. Verifica CORS en el gateway

### Múltiples recargas

**Síntoma:** La UI se recarga varias veces

**Solución:**
Aumenta `stabilityThreshold` en el file watcher:

```typescript
awaitWriteFinish: {
  stabilityThreshold: 1000, // 1 segundo
  pollInterval: 100,
}
```

### Desconexión frecuente

**Síntoma:** WebSocket se desconecta y reconecta

**Solución:**
Agrega reconexión automática:

```typescript
this.socket = io(apiUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

---

## 📝 Dependencias

### Backend

```json
{
  "dependencies": {
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "socket.io": "^4.6.0",
    "chokidar": "^3.5.3"
  }
}
```

### Frontend

```json
{
  "dependencies": {
    "socket.io-client": "^4.6.0"
  }
}
```

---

## ✅ Checklist de Implementación

- [x] Instalar dependencias backend (`@nestjs/websockets`, `socket.io`, `chokidar`)
- [x] Instalar dependencias frontend (`socket.io-client`)
- [x] Crear `DatabaseGateway` en backend
- [x] Agregar file watcher en `DatabaseService`
- [x] Crear `WebSocketService` en frontend
- [x] Actualizar `FacilityManagementService` para usar WebSocket
- [x] Actualizar `OrderManagementService` para usar WebSocket
- [x] Probar edición manual de JSON
- [x] Verificar actualización automática en UI

---

## 🎯 Resultado Final

Tu aplicación ahora:

- ✅ Detecta cambios en `database.json` automáticamente
- ✅ Actualiza la UI en tiempo real (< 1 segundo)
- ✅ Usa WebSockets eficientes en lugar de polling
- ✅ Funciona con ediciones manuales del JSON
- ✅ Sincroniza entre múltiples ventanas de la app

¡Sincronización en tiempo real implementada! 🚀
