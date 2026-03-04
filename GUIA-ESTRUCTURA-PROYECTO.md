# Guía: Estructura del Proyecto

Esta guía explica la organización completa del proyecto NEST-UI-V2.

---

## 📁 Estructura General

```
NEST-UI-V2/
├── nest-ui-fe/              # Frontend Angular
├── nest-ui-be/              # Backend NestJS
├── nest-electron/           # Electron (empaquetador)
├── nest-files-py/           # Scripts Python
├── Base_Files/              # Archivos base/templates
└── *.md                     # Guías de documentación
```

---

## 🎨 Frontend (nest-ui-fe)

### Estructura

```
nest-ui-fe/
├── src/
│   ├── app/
│   │   ├── components/          # Componentes reutilizables
│   │   │   └── shared/
│   │   │       ├── button/
│   │   │       ├── icon/
│   │   │       ├── input/
│   │   │       ├── modal/
│   │   │       └── select/
│   │   ├── pages/               # Páginas principales
│   │   │   ├── home/            # Página principal
│   │   │   ├── login/           # Página de login
│   │   │   └── set-up/          # Configuración
│   │   ├── service/             # Servicios
│   │   │   ├── home/
│   │   │   │   └── file-processing.service.ts
│   │   │   ├── set-up/
│   │   │   │   ├── facility-management.service.ts
│   │   │   │   ├── modal-state.service.ts
│   │   │   │   └── settings.service.ts
│   │   │   ├── api-url.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── electron.service.ts
│   │   │   ├── facilities-api.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── order-management.service.ts
│   │   │   ├── orders-api.service.ts
│   │   │   ├── theme.service.ts
│   │   │   └── websocket.service.ts
│   │   ├── models/              # Tipos e interfaces
│   │   │   ├── database.types.ts
│   │   │   └── processing.types.ts
│   │   ├── directives/          # Directivas
│   │   │   └── keyboard-shortcuts.directive.ts
│   │   └── config/              # Configuración
│   │       └── app.constants.ts
│   ├── environments/            # Variables de entorno
│   └── styles.css               # Estilos globales
├── package.json
└── angular.json
```

### Tecnologías

- Angular 18 (Standalone Components)
- TypeScript
- TailwindCSS
- RxJS
- Socket.IO Client

---

## 🔧 Backend (nest-ui-be)

### Estructura

```
nest-ui-be/
├── src/
│   ├── database/                # Módulo de base de datos
│   │   ├── entities/
│   │   │   ├── database.entity.ts
│   │   │   ├── facility.entity.ts
│   │   │   └── order.entity.ts
│   │   ├── dto/
│   │   │   ├── create-facility.dto.ts
│   │   │   └── create-order.dto.ts
│   │   ├── database.service.ts  # Maneja database.json
│   │   ├── database.gateway.ts  # WebSocket gateway
│   │   └── database.module.ts
│   ├── facilities/              # Módulo de facilities
│   │   ├── facilities.controller.ts
│   │   ├── facilities.service.ts
│   │   └── facilities.module.ts
│   ├── orders/                  # Módulo de orders
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   └── orders.module.ts
│   ├── auth/                    # Autenticación
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── pdf/                     # Generación de PDFs
│   │   ├── pdf.controller.ts
│   │   ├── pdf.service.ts
│   │   └── pdf.module.ts
│   ├── python/                  # Integración Python
│   │   ├── python.controller.ts
│   │   ├── python.service.ts
│   │   └── python.module.ts
│   ├── app.module.ts            # Módulo principal
│   └── main.ts                  # Entry point
├── data/
│   └── database.json            # Base de datos (desarrollo)
├── package.json
└── tsconfig.json
```

### Tecnologías

- NestJS 10
- TypeScript
- Socket.IO
- Chokidar (file watcher)
- Child Process (para Python)

---

## ⚡ Electron (nest-electron)

### Estructura

```
nest-electron/
├── src/
│   ├── main.ts                  # Proceso principal
│   ├── preload.ts               # Script de preload
│   ├── api-client.ts            # Cliente HTTP
│   └── port-finder.ts           # Búsqueda de puerto
├── release/                     # Instaladores generados
│   ├── win-unpacked/            # App sin empaquetar
│   └── *.exe                    # Instalador Windows
├── package.json
└── tsconfig.json
```

### Tecnologías

- Electron 28
- Electron Builder
- TypeScript

---

## 🐍 Scripts Python (nest-files-py)

### Estructura

```
nest-files-py/
├── generar_pdf.py               # Genera PDFs
├── saludar.py                   # Ejemplo simple
├── calculate_stats.py           # Cálculos estadísticos
└── verify_folder.py             # Verifica carpetas
```

### Bibliotecas

- reportlab (PDFs)
- pypdf (manipulación PDFs)
- pillow (imágenes)
- openpyxl (Excel)

---

## 📄 Base de Datos (database.json)

### Ubicación

- **Desarrollo:** `nest-ui-be/data/database.json`
- **Producción:** `%APPDATA%/Production Processing/database.json`

### Estructura

```json
{
  "version": "1.0.0",
  "lastModified": "2026-03-03T19:00:00.000Z",
  "facilities": [
    {
      "id": "1",
      "name": "Reynosa",
      "createdAt": "2026-03-03T19:00:00.000Z",
      "updatedAt": "2026-03-03T19:00:00.000Z"
    }
  ],
  "orders": [
    {
      "id": "1",
      "name": "Order A",
      "status": "active",
      "createdAt": "2026-03-03T19:00:00.000Z",
      "updatedAt": "2026-03-03T19:00:00.000Z"
    }
  ],
  "settings": {
    "selectedFacilityId": "1",
    "basePath": "C:\\Production\\Files",
    "os": "windows"
  }
}
```

---

## 🔄 Flujo de Datos

### 1. Usuario interactúa con UI (Angular)

```
Usuario → Componente → Servicio → HTTP/WebSocket
```

### 2. Backend procesa (NestJS)

```
Controller → Service → Database/Python → Response
```

### 3. Actualización en tiempo real

```
database.json cambia → File Watcher → Gateway → WebSocket → Frontend
```

---

## 📦 Archivos de Configuración

### Frontend

- `angular.json` - Configuración Angular
- `tsconfig.json` - TypeScript
- `tailwind.config.js` - TailwindCSS
- `package.json` - Dependencias

### Backend

- `nest-cli.json` - Configuración NestJS
- `tsconfig.json` - TypeScript
- `package.json` - Dependencias

### Electron

- `package.json` - Configuración build
- `tsconfig.json` - TypeScript

---

## 🚀 Scripts Principales

### Frontend

```json
{
  "start": "ng serve",
  "build": "ng build",
  "test": "ng test"
}
```

### Backend

```json
{
  "start:dev": "nest start --watch",
  "build": "nest build",
  "start:prod": "node dist/main"
}
```

### Electron

```json
{
  "dev": "npm run build && electron .",
  "build": "tsc",
  "dist:win": "npm run build && electron-builder --win",
  "dist:mac": "npm run build && electron-builder --mac"
}
```

---

## 📊 Dependencias Principales

### Frontend

- `@angular/core`: ^18.0.0
- `tailwindcss`: ^3.4.0
- `socket.io-client`: ^4.6.0
- `lucide-angular`: ^0.344.0

### Backend

- `@nestjs/core`: ^10.0.0
- `@nestjs/websockets`: ^10.0.0
- `socket.io`: ^4.6.0
- `chokidar`: ^3.5.3

### Electron

- `electron`: ^28.0.0
- `electron-builder`: ^24.0.0

---

## 🎯 Patrones de Diseño

### Frontend

- **Signals** - Estado reactivo (Angular 18)
- **Services** - Lógica de negocio
- **Standalone Components** - Sin módulos
- **Observables** - Comunicación asíncrona

### Backend

- **Módulos** - Organización por features
- **DTOs** - Validación de datos
- **Services** - Lógica de negocio
- **Controllers** - Endpoints REST
- **Gateways** - WebSockets

---

## 📝 Convenciones de Código

### Nombres de Archivos

- Componentes: `component-name.ts`
- Servicios: `service-name.service.ts`
- Modelos: `model-name.types.ts`
- Controladores: `controller-name.controller.ts`

### Nombres de Clases

- Componentes: `ComponentName`
- Servicios: `ServiceNameService`
- Controladores: `ControllerNameController`

### Nombres de Variables

- camelCase para variables y funciones
- PascalCase para clases e interfaces
- UPPER_CASE para constantes

---

## ✅ Checklist de Desarrollo

### Agregar Nueva Feature

- [ ] Crear entidades/tipos en `models/`
- [ ] Crear servicio en backend
- [ ] Crear controller en backend
- [ ] Crear servicio en frontend
- [ ] Crear componente/página en frontend
- [ ] Actualizar rutas si es necesario
- [ ] Agregar tests
- [ ] Actualizar documentación

---

## 🎯 Resultado

Esta estructura proporciona:

- ✅ Separación clara de responsabilidades
- ✅ Escalabilidad
- ✅ Mantenibilidad
- ✅ Reutilización de código
- ✅ Fácil navegación

¡Proyecto bien organizado! 🚀
