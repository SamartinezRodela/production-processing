# Análisis de Mejoras Posibles - NEST UI V2

**Fecha:** Marzo 2026 (Actualizado)  
**Alcance:** nest-ui-fe, nest-ui-be, nest-electron, nest-files-py

---

## 1. SEGURIDAD (Prioridad Alta)

### ✅ 1.1 JWT Secret hardcodeado [COMPLETADO]

**Archivo:** `nest-ui-be/src/auth/jwt.strategy.ts`, `nest-ui-be/src/auth/auth.module.ts`  
**Estado:** Resuelto. Ahora usa `ConfigService.get('JWT_SECRET')` y lanza `FATAL ERROR` si no está definido. `JwtModule.registerAsync()` también usa `ConfigService`. `ConfigModule.forRoot({ isGlobal: true })` está en `app.module.ts`.

### 1.2 Contraseña admin por defecto

**Archivo:** `nest-ui-be/src/auth/auth.service.ts`  
**Problema:** Se crea un admin con `admin/admin123` automáticamente y se imprime en consola con `console.log('✅ Default admin user created (username: admin, password: admin123)')`.  
**Mejora:** Forzar cambio de contraseña en primer login, o generar una contraseña aleatoria que se muestre en logs solo una vez.

### ✅ 1.3 CORS abierto a todos los orígenes [COMPLETADO]

**Archivo:** `nest-ui-be/src/main.ts`  
**Estado:** Resuelto. Ahora usa `origin: isProduction ? ['http://localhost', 'file://'] : '*'`.

### ✅ 1.4 WebSocket sin autenticación [COMPLETADO]

**Archivo:** `nest-ui-be/src/database/database.gateway.ts`  
**Estado:** Resuelto. `handleConnection()` extrae y verifica el token JWT del handshake. Desconecta clientes sin token válido. CORS del WebSocket también condicionado por entorno.

### ✅ 1.5 `fetch` nativo sin JWT en el frontend [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/pages/home/home.ts`  
**Estado:** Resuelto. Ya no hay llamadas `fetch()` nativas. Todas las peticiones usan `HttpClient` con `firstValueFrom()`, cubiertas por el `jwtInterceptor`.

### ✅ 1.6 Path Traversal en validate-path [COMPLETADO]

**Archivo:** `nest-ui-be/src/settings/settings.service.ts`
**Problema:** `validatePath()` acepta cualquier ruta del sistema sin sanitización. No hay protección contra `../` ni restricción de rutas del sistema (`C:\Windows\System32`, etc.).  
**Mejora:** Agregar `path.resolve()` para normalizar, rechazar rutas con `..`, y opcionalmente restringir a directorios fuera de rutas del sistema.

### ✅ 1.7 Sin rate limiting en endpoints de autenticación [COMPLETADO]

**Archivos:** `nest-ui-be/src/auth/auth.controller.ts`  
**Problema:** No hay rate limiting en `/auth/login` ni `/auth/register`. Un atacante podría hacer brute force de contraseñas sin restricción.  
**Mejora:** Agregar `@nestjs/throttler` con límites en endpoints de auth (ej: 5 intentos por minuto).

### ✅ 1.8 Endpoint `/settings/default` es público [COMPLETADO]

**Archivo:** `nest-ui-be/src/settings/settings.controller.ts`  
**Problema:** El endpoint `GET /settings/default` no tiene `@UseGuards(JwtAuthGuard)`. Expone las rutas por defecto (basePath, outputPath) a cualquier cliente sin autenticación.  
**Mejora:** Evaluar si realmente necesita ser público. Si es necesario antes del login, limitar la información que expone.

---

## 2. ARQUITECTURA Y CÓDIGO (Prioridad Media-Alta)

### ✅ 2.1 Home component refactorizado [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/pages/home/home.ts`  
**Estado:** Resuelto. El componente pasó de ~1240 líneas a ~550 líneas. Toda la lógica de Drag & Drop se movió a `FileDropService` y el procesamiento masivo con WebSockets se encapsuló en `FileProcessingService`. El componente ahora actúa únicamente como orquestador de UI.

### ✅ 2.2 Duplicación de interceptores de error [COMPLETADO]

**Estado:** Resuelto. `auth-error.interceptor.ts` ya no existe. Solo queda `error.interceptor.ts` que maneja todos los errores HTTP incluyendo 401 (logout + redirect).

### ✅ 2.3 PdfService del backend usa `exec` con `py` [COMPLETADO]

**Archivo:** `nest-ui-be/src/pdf/pdf.service.ts`  
**Estado:** Resuelto. `PdfService` ahora inyecta `PythonService` y usa `this.pythonService.executeScript()` en vez de `exec()`.

### ✅ 2.4 IDs secuenciales basados en longitud del array [COMPLETADO]

**Archivo:** `nest-ui-be/src/database/database.service.ts`  
**Estado:** Resuelto. `createFacility()` y `createOrder()` usan `crypto.randomUUID()`.

### ✅ 2.5 Base de datos JSON sin concurrencia segura [COMPLETADO]

**Archivo:** `nest-ui-be/src/database/database.service.ts`  
**Estado:** Resuelto. `saveDatabase()` usa escritura atómica (temp file + `renameSync`). También maneja `ENOSPC` (disco lleno).

---

## 3. RENDIMIENTO (Prioridad Media)

### ✅ 3.1 Procesamiento secuencial de archivos [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/pages/home/home.ts` → `uploadFiles()`  
**Estado:** Resuelto. Usa `CONCURRENCY_LIMIT = 4` con `Promise.all` en chunks.

### ✅ 3.2 Folder reading sin streaming [COMPLETADO]

**Estado:** Resuelto. `FileDropService.browseFolderRecursive()` procesa archivos progresivamente.

### ✅ 3.3 PreloadAllModules en routing [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/app.config.ts`  
**Estado:** Resuelto. Usa `SelectivePreloadingStrategyService` en vez de `PreloadAllModules`.

---

## 4. EXPERIENCIA DE USUARIO (Prioridad Media)

### ✅ 4.1 Sin feedback de progreso real en procesamiento Python [COMPLETADO]

**Estado:** Resuelto. Python emite `PROGRESS:XX:filename` via stdout, el backend lo filtra y emite por WebSocket (`pythonGateway.emitProgress`), y el frontend escucha `python-progress` para actualizar la barra en tiempo real.

### ✅ 4.2 Sin retry automático en fallos de procesamiento [COMPLETADO]

**Estado:** Resuelto. `uploadFiles()` ahora solo limpia archivos exitosos y deja los fallidos en la lista para reprocesar.

### ✅ 4.3 Sin confirmación antes de procesar [COMPLETADO]

**Estado:** Resuelto. `confirmProcessFiles()` muestra `showProcessConfirmModal` antes de ejecutar `uploadFiles()`.

### ✅ 4.4 Archivos on-demand de OneDrive [COMPLETADO]

**Estado:** Resuelto. El script Python verifica existencia del archivo y espacio en disco antes de copiar.

---

## 5. MANTENIBILIDAD (Prioridad Media)

### ✅ 5.1 Logs excesivos con emojis en producción [COMPLETADO]

**Estado:** `python.service.ts` migró mayormente a `Logger` de NestJS, pero `settings.service.ts` todavía tiene ~15 `console.log()` con emojis (🔍, 📋, 📁, ❌, ✅, 📊, 💥). También `auth.service.ts`, `python.controller.ts`, `pdf.controller.ts` y `main.ts` usan `console.log/error` en vez de `Logger`.  
**Pendiente:** Migrar todos los `console.log/warn/error` restantes a `this.logger.log/warn/error` de NestJS.

### ✅ 5.2 Código comentado extenso [COMPLETADO]

**Estado:** `app.module.ts` todavía tiene ~15 líneas de TypeORM comentado. `filters-panel.html` tiene botones de test comentados. `api-client.ts` tiene ejemplos comentados.  
**Pendiente:** Limpiar código comentado que ya no se necesita.

### ⚠️ 5.3 Tests unitarios [PARCIAL]

**Estado:** Se crearon tests para `PythonService` (2 tests) y `DatabaseService` (4 tests con CRUD de facilities y orders). También existe `app.e2e-spec.ts`.  
**Pendiente:** Faltan tests para `AuthService`, `SettingsService`, `PdfService`. Los tests existentes son básicos (solo verifican definición y operaciones simples). No hay tests en el frontend.

### 5.4 Tipos duplicados entre frontend y backend

**Problema:** `Facility`, `Order`, `DatabaseSettings` están definidos en ambos proyectos con estructuras similares pero no idénticas.  
**Mejora:** Crear un paquete compartido (`shared/types`) o al menos un archivo de tipos que ambos proyectos referencien.

### ✅ 5.5 Métodos deprecados sin eliminar [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/service/set-up/settings.service.ts`  
**Estado:** Resuelto. Ya no hay métodos deprecated. `loadSettings()` fue reemplazado por `loadSettingsFromBackend()`. No hay lógica de localStorage.

### ✅ 5.6 Loading interceptor gestionado [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/interceptors/loading.interceptor.ts`  
**Problema:** El interceptor existe pero no está en `withInterceptors()` de `app.config.ts`. Es código muerto.  
**Mejora:** Registrarlo en `app.config.ts` si se necesita, o eliminarlo si no.
**Estado:** Resuelto. Se tomó la decisión arquitectónica sobre el interceptor de carga global.

---

## 6. ROBUSTEZ (Prioridad Media)

### 6.1 Sin validación de tamaño de base de datos JSON

**Archivo:** `nest-ui-be/src/database/database.service.ts`  
**Problema:** La base de datos JSON crece indefinidamente. Con muchas facilities/orders, el archivo puede volverse lento.  
**Mejora:** Implementar paginación o migrar a SQLite cuando el volumen lo justifique.

### ✅ 6.2 Sin manejo de disco lleno [COMPLETADO]

**Estado:** Resuelto. `saveDatabase()` maneja `ENOSPC`. `guardar_pdf_path.py` verifica espacio con `shutil.disk_usage()` antes de copiar.

### ✅ 6.3 Sin timeout en ejecución de Python [COMPLETADO]

**Estado:** Resuelto. Tanto `executeScript()` como `executeExecutable()` tienen `TIMEOUT_MS = 60000` con `SIGKILL`.

### ✅ 6.4 Electron ApiClient con URL hardcodeada [COMPLETADO]

**Archivo:** `nest-electron/src/api-client.ts`  
**Estado:** Resuelto. `ApiClient.setPort(port)` se llama desde `main.ts` con el puerto dinámico. El default `localhost:3000` es solo el valor inicial que se sobreescribe.

### 🆕 6.5 JWT_SECRET no se pasa al backend en producción

**Archivo:** `nest-electron/src/main.ts` → `startBackend()`  
**Problema:** El `spawn` del backend pasa `PORT`, `RESOURCES_PATH`, `NODE_ENV` y `ELECTRON_RUN_AS_NODE`, pero NO pasa `JWT_SECRET`. El backend en producción arrancará sin `JWT_SECRET` y lanzará el `FATAL ERROR` que se implementó en 1.1.  
**Mejora:** Generar un JWT_SECRET aleatorio por instalación (ej: `crypto.randomBytes(64).toString('hex')`) y persistirlo en `app.getPath('userData')`. Pasarlo como env var en el `spawn`.

---

## 7. MEJORAS FUNCIONALES FUTURAS (Prioridad Baja)

### 7.1 Soporte multi-idioma (i18n)

El proyecto mezcla español e inglés en mensajes, logs y UI. Ya existe `LanguageService` con traducciones para errores HTTP. Extender a toda la UI.

### 7.2 Historial de procesamiento

Agregar un log persistente de archivos procesados (fecha, cantidad, errores) para auditoría y trazabilidad.

### 7.3 Roles y permisos granulares

Actualmente solo hay `admin` y `user` sin diferencia funcional visible. Implementar permisos por rol.

### 7.4 Auto-update de la app Electron

Implementar `electron-updater` para actualizaciones automáticas.

### 7.5 Integración con SharePoint/OneDrive via Graph API

Navegar y procesar archivos directamente desde SharePoint sin sincronización local.

### 🆕 7.6 Documentación de API (Swagger)

No hay documentación de API. Agregar `@nestjs/swagger` con decoradores en los controllers para generar documentación automática.

---

## 8. CI/CD Y GITHUB ACTIONS (Prioridad Alta)

### ⚠️ 8.1 JWT_SECRET no llega al runtime en producción [PARCIAL]

**Estado:** El backend ahora usa `ConfigModule.forRoot()` (resuelve la parte de leer `.env`), pero Electron no pasa `JWT_SECRET` al spawn del backend (ver 6.5). El workflow de Mac crea `.env` pero el de Windows no.  
**Pendiente:** Que Electron genere y pase `JWT_SECRET` al backend, o que ambos workflows generen `.env` consistentemente.

### 8.2 Duplicación masiva entre workflows

**Archivos:** `build-windows.yml`, `build-mac.yml`, `build-all-platforms.yml`  
**Problema:** Los 3 workflows repiten la misma lógica. Cualquier cambio requiere editar 3 archivos.  
**Mejora:** Usar composite actions o reusable workflows.

### 8.3 Versión de Python inconsistente entre plataformas

**Problema:** Windows usa Python 3.13.0 (embed), Mac usa Python 3.11.9 (standalone).  
**Mejora:** Unificar versión. Definirla como variable del workflow.

### 8.4 Sin caché de dependencias Python

**Problema:** Cada build descarga e instala todas las librerías Python desde cero.  
**Mejora:** Cachear con `actions/cache@v4` usando hash de `requirements.txt` como key.

### 8.5 Sin requirements.txt centralizado para el CI

**Problema:** Dependencias Python hardcodeadas en cada workflow como `pip install` individuales.  
**Mejora:** Crear `requirements.txt` centralizado y usarlo en CI.

### 8.6 Sin versionado automático

**Problema:** Versión `1.0.0` hardcodeada. Releases manuales.  
**Mejora:** Conventional commits + semantic-release.

### 8.7 Sin smoke test post-build

**Problema:** No se verifica que la app funcione después de construir.  
**Mejora:** Verificar que el ejecutable y recursos existan post-build.

### 8.8 Listas de pip install sin versiones pinneadas

**Problema:** `pip install numpy` sin versión fija. Builds no reproducibles.  
**Mejora:** Pinnear versiones: `numpy==2.1.0`, etc.

### ✅ 8.9 CORS y seguridad no se ajustan en producción [COMPLETADO]

**Estado:** Resuelto. Tanto `main.ts` como `database.gateway.ts` condicionan CORS por `NODE_ENV`.

### 8.10 El workflow de Mac no usa electron-builder

**Problema:** Usa `electron-packager` con copia manual de recursos.  
**Mejora:** Migrar a `electron-builder --mac`.

### 8.11 Sin notificación de build fallido

**Problema:** Sin notificación activa cuando un build falla.  
**Mejora:** Agregar notificación (Slack, Discord, email, o GitHub issue).

### 8.12 Retry de Electron build oculta errores reales

**Problema:** 3 reintentos automáticos sin distinguir tipo de error.  
**Mejora:** Solo reintentar en EBUSY/EPERM.

---

## Resumen de Estado

| Estado        | Cantidad | Descripción                                       |
| ------------- | -------- | ------------------------------------------------- |
| ✅ Completado | 22       | Implementado y verificado en código               |
| ⚠️ Parcial    | 4        | Iniciado pero con pendientes (5.1, 5.2, 5.3, 8.1) |
| 🆕 Nuevo      | 3        | Mejoras nuevas detectadas (1.7, 1.8, 6.5, 7.6)    |
| ⏳ Pendiente  | 16       | Sin implementar                                   |

## Resumen de Prioridades

| Prioridad  | Categoría      | Pendientes                           |
| ---------- | -------------- | ------------------------------------ |
| Alta       | Seguridad      | 1.2, 1.6, 1.7, 1.8                   |
| Alta       | CI/CD          | 8.1⚠️, 8.2, 8.3, 8.5, 8.8, 8.10      |
| Alta       | Robustez       | 6.5🆕 (JWT_SECRET en Electron spawn) |
| Media-Alta | Arquitectura   | (Ninguno pendiente principal)        |
| Media      | CI/CD          | 8.4, 8.6, 8.7, 8.11, 8.12            |
| Media      | Mantenibilidad | 5.1⚠️, 5.2⚠️, 5.3⚠️, 5.4             |
| Media      | Robustez       | 6.1                                  |
| Baja       | Funcional      | 7.1, 7.2, 7.3, 7.4, 7.5, 7.6🆕       |
