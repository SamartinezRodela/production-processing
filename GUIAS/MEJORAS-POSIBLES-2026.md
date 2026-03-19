# Análisis de Mejoras Posibles - NEST UI V2

**Fecha:** Marzo 2026  
**Alcance:** nest-ui-fe, nest-ui-be, nest-electron, nest-files-py

---

## 1. SEGURIDAD (Prioridad Alta)

### ✅ 1.1 JWT Secret hardcodeado [COMPLETADO]

**Archivo:** `nest-ui-be/src/auth/jwt.strategy.ts`  
**Problema:** El secret es `'default-secret-change-in-production'` como fallback. Si `JWT_SECRET` no está en env, cualquiera puede forjar tokens.  
**Mejora:** Forzar que la app no arranque sin un `JWT_SECRET` definido. Lanzar error en bootstrap si no existe.

### 1.2 Contraseña admin por defecto

**Archivo:** `nest-ui-be/src/auth/auth.service.ts`  
**Problema:** Se crea un admin con `admin/admin123` automáticamente. En producción esto es un riesgo.  
**Mejora:** Forzar cambio de contraseña en primer login, o generar una contraseña aleatoria que se muestre en logs solo una vez.

### ✅ 1.3 CORS abierto a todos los orígenes [COMPLETADO]

**Archivo:** `nest-ui-be/src/main.ts`  
**Problema:** `origin: '*'` permite peticiones desde cualquier origen.  
**Mejora:** En producción, restringir a `http://localhost` y el esquema `file://` que usa Electron empaquetado.

### ✅ 1.4 WebSocket sin autenticación [COMPLETADO]

**Archivo:** `nest-ui-be/src/database/database.gateway.ts`  
**Problema:** El gateway WebSocket no valida JWT. Cualquier cliente puede conectarse y recibir eventos de cambios en la base de datos.  
**Mejora:** Implementar un guard o middleware en el gateway que valide el token JWT en el handshake.

### ✅ 1.5 `fetch` nativo sin JWT en el frontend [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/pages/home/home.ts`  
**Problema:** Varias llamadas usan `fetch()` nativo en vez de `HttpClient`, lo que bypasea el `jwtInterceptor`. Esto ya se corrigió parcialmente pero el patrón debería eliminarse.  
**Mejora:** Reemplazar todas las llamadas `fetch()` por `HttpClient` para que el interceptor JWT las cubra automáticamente. Esto elimina la necesidad de agregar el token manualmente.

### 1.6 Path Traversal en validate-path

**Archivo:** `nest-ui-be/src/settings/settings.service.ts`  
**Problema:** `validatePath()` acepta cualquier ruta del sistema sin sanitización. Un atacante podría validar rutas sensibles como `C:\Windows\System32`.  
**Mejora:** Restringir las rutas validables a directorios permitidos o al menos fuera de rutas del sistema.

---

## 2. ARQUITECTURA Y CÓDIGO (Prioridad Media-Alta)

### ✅ 2.1 Home component demasiado grande [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/pages/home/home.ts`  
**Problema:** El componente Home tiene ~1240 líneas con ~50 métodos. Maneja paths, procesamiento, PDF, drag-drop, folder browsing, settings, etc.  
**Mejora:** Extraer lógica a servicios dedicados:

- `PathConfigurationService` → manejo de basePath/outputPath, validación, browse
- Mover `uploadFiles()` completamente a `FileProcessingService`
- Mover la lógica de PDF modal a un componente/servicio separado

### ✅ 2.2 Duplicación de interceptores de error [COMPLETADO]

**Archivos:** `auth-error.interceptor.ts` y `error.interceptor.ts`  
**Problema:** Ambos interceptores manejan el error 401 con lógica diferente. `auth-error.interceptor` hace logout y redirige, `error.interceptor` también redirige al login en 401.  
**Mejora:** Unificar en un solo interceptor de errores HTTP que maneje todos los casos.

### ✅ 2.3 PdfService del backend usa `exec` con `py` [COMPLETADO]

**Archivo:** `nest-ui-be/src/pdf/pdf.service.ts`  
**Problema:** Usa `exec('py ...')` directamente, mientras que `PythonService` usa `spawn` con Python embebido y verificación de integridad. Son dos formas distintas de ejecutar Python.  
**Mejora:** Unificar la ejecución de Python a través de `PythonService` para que `PdfService` también use Python embebido con verificación de hashes.

### ✅ 2.4 IDs secuenciales basados en longitud del array [COMPLETADO]

**Archivo:** `nest-ui-be/src/database/database.service.ts`  
**Problema:** `createFacility` y `createOrder` generan IDs con `(array.length + 1).toString()`. Si se elimina un elemento y se crea otro, habrá colisión de IDs.  
**Mejora:** Usar UUIDs (`crypto.randomUUID()`) o un contador incremental persistido.

### ✅ 2.5 Base de datos JSON sin concurrencia segura [COMPLETADO]

**Archivo:** `nest-ui-be/src/database/database.service.ts`  
**Problema:** `saveDatabase()` usa `writeFileSync` sin lock. Si dos operaciones escriben simultáneamente, puede corromperse el archivo.  
**Mejora:** Implementar un mecanismo de lock (ej: `proper-lockfile`) o usar escritura atómica (escribir a temp y renombrar).

---

## 3. RENDIMIENTO (Prioridad Media)

### ✅ 3.1 Procesamiento secuencial de archivos [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/pages/home/home.ts` → `uploadFiles()`  
**Problema:** Los archivos se procesan uno por uno en un `for` loop secuencial. Con muchos archivos, esto es lento.  
**Mejora:** Implementar procesamiento en lotes (batch) con concurrencia controlada (ej: 3-5 archivos en paralelo usando `Promise.all` con chunks).

### ✅ 3.2 Folder reading sin streaming [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/service/home/file-drop.service.ts`  
**Problema:** `browseFolderRecursive` carga todos los archivos en memoria antes de procesarlos.  
**Mejora:** Procesar archivos conforme se van descubriendo (streaming) para reducir uso de memoria con carpetas grandes.

### ✅ 3.3 PreloadAllModules en routing [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/app.config.ts`  
**Problema:** `PreloadAllModules` carga todos los módulos lazy al inicio. Con pocas rutas no es grave, pero si la app crece, aumentará el tiempo de carga inicial.  
**Mejora:** Considerar una estrategia de preload selectiva cuando la app tenga más rutas.

---

## 4. EXPERIENCIA DE USUARIO (Prioridad Media)

### ✅ 4.1 Sin feedback de progreso real en procesamiento Python [COMPLETADO]

**Problema:** El progreso se calcula como `(i+1)/total * 100` basado en el índice del archivo, no en el progreso real del script Python.  
**Mejora:** Implementar comunicación de progreso desde Python via stdout parcial o WebSocket para mostrar progreso real por archivo.

### ✅ 4.2 Sin retry automático en fallos de procesamiento [COMPLETADO]

**Archivo:** `home.ts` → `uploadFiles()`  
**Problema:** Si un archivo falla, se registra el error y se continúa. No hay opción de reintentar solo los fallidos.  
**Mejora:** Agregar botón "Retry Failed" que reintente solo los archivos que fallaron, sin reprocesar los exitosos.

### ✅ 4.3 Sin confirmación antes de procesar [COMPLETADO]

**Problema:** Al hacer click en "Process", se inicia inmediatamente sin confirmación.  
**Mejora:** Agregar un modal de confirmación que muestre: cantidad de archivos, output path, y espacio estimado.

### ✅ 4.4 Archivos on-demand de OneDrive [COMPLETADO]

**Problema:** Si el basePath apunta a una carpeta sincronizada con OneDrive/SharePoint, los archivos "on-demand" (solo en la nube) no están realmente en disco. Python fallará al intentar leerlos.  
**Mejora:** Detectar archivos on-demand antes de procesar y notificar al usuario que debe descargarlos primero, o implementar descarga programática.

---

## 5. MANTENIBILIDAD (Prioridad Media)

### ✅ 5.1 Logs excesivos con emojis en producción [COMPLETADO]

**Archivos:** Múltiples archivos del backend  
**Problema:** Hay `console.log` con emojis (✅, ❌, 📁, 💾) por todo el backend. En producción estos logs son ruido.  
**Mejora:** Usar el `Logger` de NestJS consistentemente con niveles (debug, log, warn, error). Configurar nivel de log según entorno.

### ✅ 5.2 Código comentado extenso [COMPLETADO]

**Archivos:** `nest-ui-be/src/app.module.ts`, `path-configuration-panel.html`, `filters-panel.html`  
**Problema:** Hay bloques grandes de código comentado (TypeORM, Base Path UI, botones de test). Esto dificulta la lectura.  
**Mejora:** Eliminar código comentado que ya no se necesita. Usar git history para recuperarlo si es necesario.

### ✅ 5.3 Sin tests unitarios [COMPLETADO]

**Problema:** No hay tests unitarios para servicios del frontend ni del backend (solo `app.controller.spec.ts` por defecto).  
**Mejora:** Agregar tests para:

- `PdfNameValidatorService` (lógica de validación de nombres)
- `AuthService` del backend (login, register, JWT)
- `DatabaseService` (CRUD operations)
- `PythonService` (ejecución de scripts)

### 5.4 Tipos duplicados entre frontend y backend

**Problema:** `DatabaseSettings`, `Facility`, `Order` están definidos tanto en el backend como en el frontend con estructuras similares pero no idénticas.  
**Mejora:** Crear un paquete compartido (`shared/types`) o al menos un archivo de tipos que ambos proyectos referencien para mantener sincronía.

### ✅ 5.5 Métodos deprecados sin eliminar [COMPLETADO]

**Archivo:** `nest-ui-fe/src/app/service/set-up/settings.service.ts`  
**Problema:** `loadSettings()` está marcado como deprecated pero sigue existiendo. `getSettings()` lee de localStorage que ya no se usa.  
**Mejora:** Eliminar métodos deprecated y la lógica de migración de localStorage si ya no hay usuarios en la versión vieja.

---

## 6. ROBUSTEZ (Prioridad Media)

### 6.1 Sin validación de tamaño de base de datos JSON

**Archivo:** `nest-ui-be/src/database/database.service.ts`  
**Problema:** La base de datos JSON crece indefinidamente. Con muchas facilities/orders, el archivo puede volverse lento de leer/escribir.  
**Mejora:** Implementar un límite o paginación. Considerar migrar a SQLite (ya hay código comentado para TypeORM) cuando el volumen lo justifique.

### ✅ 6.2 Sin manejo de disco lleno [COMPLETADO]

**Archivos:** `guardar_pdf_path.py`, `database.service.ts`  
**Problema:** Si el disco está lleno, `shutil.copy2` y `writeFileSync` fallarán sin un mensaje claro para el usuario.  
**Mejora:** Verificar espacio disponible antes de copiar/escribir y mostrar un mensaje descriptivo.

### ✅ 6.3 Sin timeout en ejecución de Python [COMPLETADO]

**Archivo:** `nest-ui-be/src/python/python.service.ts`  
**Problema:** Si un script Python se cuelga, el proceso hijo queda corriendo indefinidamente.  
**Mejora:** Agregar timeout configurable al `spawn` de Python (ej: 60 segundos por archivo) y matar el proceso si excede.

### ✅ 6.4 Electron ApiClient con URL hardcodeada [COMPLETADO]

**Archivo:** `nest-electron/src/api-client.ts`  
**Problema:** `API_BASE_URL = "http://localhost:3000"` está hardcodeado, pero el backend usa puerto dinámico.  
**Mejora:** Hacer que `ApiClient` reciba el puerto dinámico descubierto por `port-finder.ts`.

---

## 7. MEJORAS FUNCIONALES FUTURAS (Prioridad Baja)

### 7.1 Soporte multi-idioma (i18n)

El proyecto mezcla español e inglés en mensajes, logs y UI. Implementar Angular i18n o ngx-translate para soportar ambos idiomas formalmente.

### 7.2 Historial de procesamiento

Agregar un log persistente de archivos procesados (fecha, cantidad, errores) para auditoría y trazabilidad.

### 7.3 Roles y permisos granulares

Actualmente solo hay `admin` y `user` sin diferencia funcional visible. Implementar permisos por rol (ej: solo admin puede cambiar settings, user solo puede procesar).

### 7.4 Auto-update de la app Electron

Implementar `electron-updater` para que la app se actualice automáticamente cuando haya nuevas versiones.

### 7.5 Integración con SharePoint/OneDrive via Graph API

Como se discutió anteriormente, agregar la opción de navegar y procesar archivos directamente desde SharePoint sin necesidad de sincronización local.

---

## 8. CI/CD Y GITHUB ACTIONS (Prioridad Alta)

### 8.1 JWT_SECRET no se inyecta en el bundle de producción

**Archivos:** `build-windows.yml`, `build-mac.yml`, `nest-ui-be/src/auth/auth.module.ts`  
**Problema:** El workflow pasa `JWT_SECRET` como env var durante el `npm run build` del backend, pero `JwtModule.register()` lee `process.env.JWT_SECRET` en runtime, no en build time. El backend compilado (dist/) no tiene el secret embebido. En producción, cuando Electron lanza el backend como child process, ese proceso no tiene la variable de entorno `JWT_SECRET` definida, así que cae al fallback `'default-secret-change-in-production'`.  
**Excepción:** El workflow de Mac sí crea un archivo `.env` en `$RESOURCES_DIR/backend/.env`, pero el backend NestJS no usa `dotenv` ni `@nestjs/config` para cargarlo, así que ese `.env` no se lee.  
**Mejora:**

- Opción A: Agregar `@nestjs/config` con `ConfigModule.forRoot()` para que el backend lea un `.env` en runtime. Luego asegurar que todos los workflows generen ese `.env` en la carpeta correcta.
- Opción B: Que Electron inyecte `JWT_SECRET` como variable de entorno al hacer `spawn` del backend en `nest-electron/src/main.ts`. Generar el secret durante el build y guardarlo en un archivo de config que Electron lea.
- Opción C (más segura): Generar un JWT_SECRET aleatorio por instalación en el primer arranque y persistirlo en `userData`.

### 8.2 Duplicación masiva entre workflows

**Archivos:** `build-windows.yml`, `build-mac.yml`, `build-all-platforms.yml`  
**Problema:** Los 3 workflows repiten la misma lógica de setup de Python, compilación, instalación de dependencias, etc. `build-all-platforms.yml` es esencialmente una copia de los otros dos combinados. Cualquier cambio (agregar una librería Python, cambiar versión de Node, etc.) requiere editar 3 archivos.  
**Mejora:** Usar composite actions o reusable workflows:

- Crear `.github/actions/setup-python-embedded/action.yml` para la lógica de Python
- Crear `.github/actions/build-app/action.yml` para build de frontend/backend
- Los 3 workflows solo referencian estas acciones compartidas

### 8.3 Versión de Python inconsistente entre plataformas

**Archivos:** `build-windows.yml`, `build-mac.yml`  
**Problema:** Windows usa Python 3.13.0 (embed), Mac usa Python 3.11.9 (standalone). Los `.pyc` compilados con una versión no son compatibles con otra. Si un script usa features de 3.13, fallará en Mac.  
**Mejora:** Unificar la versión de Python en ambas plataformas. Usar 3.11.x en ambas (más estable) o 3.13.x en ambas. Definir la versión como variable de entorno del workflow para cambiarla en un solo lugar.

### 8.4 Sin caché de dependencias Python

**Archivos:** Todos los workflows  
**Problema:** Cada build descarga e instala todas las librerías Python desde cero (numpy, pandas, scipy, opencv, etc.). Esto toma varios minutos y consume bandwidth.  
**Mejora:** Cachear la carpeta `nest-files-py-embedded` (o `nest-files-py-embedded-mac`) usando `actions/cache@v4` con un hash del `requirements.txt` como key. Solo reinstalar si cambian las dependencias.

### 8.5 Sin requirements.txt centralizado para el CI

**Archivos:** Todos los workflows  
**Problema:** Las dependencias Python están hardcodeadas en cada workflow como comandos `pip install` individuales. Si necesitas agregar una librería, hay que editar múltiples archivos.  
**Mejora:** Crear un `nest-files-py/requirements.txt` con todas las dependencias y usar `pip install -r requirements.txt` en los workflows. Ya existe `nest-files-py-embedded/requirements.txt` pero no se usa en CI.

### 8.6 Sin versionado automático

**Archivos:** `nest-electron/package.json`, workflows  
**Problema:** La versión es `1.0.0` hardcodeada. Los releases se crean manualmente con tags `v*`.  
**Mejora:** Implementar versionado semántico automático basado en commits (conventional commits + semantic-release) o al menos un step que lea la versión del `package.json` y la use para nombrar artifacts.

### 8.7 Sin smoke test post-build

**Archivos:** Todos los workflows  
**Problema:** Después de construir el instalador/portable, no se verifica que la app funcione. El artifact podría estar corrupto o incompleto.  
**Mejora:** Agregar un step que:

- Extraiga el portable
- Verifique que el ejecutable existe
- Verifique que los recursos (frontend, backend, python) están presentes
- Opcionalmente, lance la app headless y verifique que el backend responde en un puerto

### 8.8 Listas de pip install sin versiones pinneadas

**Archivos:** Todos los workflows  
**Problema:** `pip install numpy` instala la última versión disponible. Un build de hoy puede tener numpy 2.x y uno de mañana numpy 3.x, causando incompatibilidades silenciosas.  
**Mejora:** Pinnear versiones en `requirements.txt`: `numpy==2.1.0`, `pandas==2.2.0`, etc. Esto garantiza builds reproducibles.

### 8.9 CORS y seguridad no se ajustan en producción

**Archivos:** `nest-ui-be/src/main.ts`, workflows  
**Problema:** `origin: '*'` en CORS se usa tanto en desarrollo como en producción. El workflow no cambia esta configuración para el build de producción.  
**Mejora:** Usar `NODE_ENV` para condicionar el CORS:

```typescript
app.enableCors({
  origin:
    process.env.NODE_ENV === "production"
      ? ["http://localhost", "file://"]
      : "*",
});
```

### 8.10 El workflow de Mac no usa electron-builder

**Archivo:** `build-mac.yml`  
**Problema:** Usa `electron-packager` en vez de `electron-builder`, y luego copia recursos manualmente (`cp -r frontend`, `cp -r backend`, etc.). Esto bypasea la configuración de `extraResources` del `package.json` y es propenso a errores si cambia la estructura.  
**Mejora:** Migrar a `electron-builder --mac` (como hace `build-all-platforms.yml`) para que use la misma configuración de empaquetado que Windows. Esto elimina los steps manuales de copia de recursos.

### 8.11 Sin notificación de build fallido

**Archivos:** Todos los workflows  
**Problema:** Si un build falla, solo se ve en la pestaña Actions de GitHub. No hay notificación activa.  
**Mejora:** Agregar un step de notificación (Slack, Discord, email, o GitHub issue automático) cuando un build falla en `main`.

### 8.12 Retry de Electron build oculta errores reales

**Archivo:** `build-windows.yml`  
**Problema:** El build de Electron tiene 3 reintentos automáticos. Si falla por un error real (no EBUSY), se reintenta innecesariamente y el log se llena de ruido.  
**Mejora:** Detectar el tipo de error antes de reintentar. Solo reintentar en errores EBUSY/EPERM, fallar inmediatamente en otros errores.

---

## Resumen de Prioridades

| Prioridad  | Categoría      | Items                              |
| ---------- | -------------- | ---------------------------------- |
| Alta       | Seguridad      | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6       |
| Alta       | CI/CD          | 8.1, 8.2, 8.3, 8.5, 8.8, 8.9, 8.10 |
| Media-Alta | Arquitectura   | 2.1, 2.2, 2.3, 2.4, 2.5            |
| Media      | CI/CD          | 8.4, 8.6, 8.7, 8.11, 8.12          |
| Media      | Rendimiento    | 3.1, 3.2, 3.3                      |
| Media      | UX             | 4.1, 4.2, 4.3, 4.4                 |
| Media      | Mantenibilidad | 5.1, 5.2, 5.3, 5.4, 5.5            |
| Media      | Robustez       | 6.1, 6.2, 6.3, 6.4                 |
| Baja       | Funcional      | 7.1, 7.2, 7.3, 7.4, 7.5            |
| Baja       | Funcional      | 7.1, 7.2, 7.3, 7.4, 7.5            |
