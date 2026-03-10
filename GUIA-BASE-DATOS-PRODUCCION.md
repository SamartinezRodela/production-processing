# 📊 Guía: Base de Datos en Producción

## 🎯 Cómo Funciona

### Desarrollo vs Producción

| Aspecto          | Desarrollo                      | Producción                                      |
| ---------------- | ------------------------------- | ----------------------------------------------- |
| **Ubicación**    | `nest-ui-be/data/database.json` | `%APPDATA%/Production Processing/database.json` |
| **Creación**     | Manual o automática             | Automática en primer inicio                     |
| **Plantilla**    | No aplica                       | Copia desde `resources/backend/data/`           |
| **Persistencia** | En carpeta del proyecto         | En carpeta de usuario                           |

---

## 📁 Ubicaciones de la Base de Datos

### Windows (Producción)

```
C:\Users\[Usuario]\AppData\Roaming\Production Processing\database.json
```

### Mac (Producción)

```
~/Library/Application Support/Production Processing/database.json
```

### Desarrollo

```
nest-ui-be/data/database.json
```

---

## 🔄 Flujo en Producción

### Primera Vez que se Ejecuta la App

```
1. Usuario instala la aplicación
2. Usuario abre la aplicación
3. Backend inicia
4. DatabaseService.getDatabasePath() se ejecuta
5. Detecta que es producción
6. Busca: %APPDATA%/Production Processing/database.json
7. ¿Existe?
   ├─ NO → Intenta copiar plantilla desde resources/backend/data/
   │        ├─ ¿Existe plantilla?
   │        │  ├─ SÍ → Copia plantilla ✅
   │        │  └─ NO → Crea base de datos por defecto ✅
   │        └─ Base de datos lista
   └─ SÍ → Carga base de datos existente ✅
```

### Ejecuciones Posteriores

```
1. Usuario abre la aplicación
2. Backend inicia
3. DatabaseService carga: %APPDATA%/Production Processing/database.json
4. Usa datos guardados del usuario ✅
```

---

## 📦 Configuración en package.json

### Antes (sin carpeta data)

```json
"extraResources": [
  {
    "from": "../nest-ui-be/dist",
    "to": "backend/dist"
  },
  {
    "from": "../nest-ui-be/package.json",
    "to": "backend/package.json"
  }
]
```

### Después (con carpeta data) ✅

```json
"extraResources": [
  {
    "from": "../nest-ui-be/dist",
    "to": "backend/dist"
  },
  {
    "from": "../nest-ui-be/package.json",
    "to": "backend/package.json"
  },
  {
    "from": "../nest-ui-be/data",
    "to": "backend/data",
    "filter": ["**/*"]
  }
]
```

---

## 🏗️ Estructura del Instalador

### Antes

```
Production Processing.exe
└── resources/
    ├── frontend/
    ├── backend/
    │   ├── dist/
    │   ├── node_modules/
    │   └── package.json
    └── python/
```

### Después ✅

```
Production Processing.exe
└── resources/
    ├── frontend/
    ├── backend/
    │   ├── dist/
    │   ├── node_modules/
    │   ├── package.json
    │   └── data/              ← NUEVO
    │       └── database.json  ← Plantilla inicial
    └── python/
```

---

## 💾 Contenido de database.json

### Estructura

```json
{
  "version": "1.0.0",
  "lastModified": "2026-03-09T20:41:07.410Z",
  "facilities": [
    {
      "id": "1",
      "name": "Reynosa",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "orders": [
    {
      "id": "1",
      "name": "Laser",
      "status": "active",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "defaultSettings": {
    "selectedFacilityId": "1",
    "basePath": "C:\\Production\\Documentes\\BasePath",
    "outputPath": "C:\\Production\\Documents\\OutputPath",
    "os": "windows",
    "theme": "dark",
    "autoSave": false,
    "notifications": true
  },
  "settings": { ... }
}
```

---

## 🔧 Código Actualizado

### database.service.ts

```typescript
private getDatabasePath(): string {
  const isProduction = process.env.NODE_ENV === 'production' ||
                       (process as any).resourcesPath !== undefined;

  if (isProduction) {
    const userDataPath = process.env.APPDATA ||
                         path.join(process.env.HOME || '~', '.config');
    const appFolder = path.join(userDataPath, 'Production Processing');

    if (!fs.existsSync(appFolder)) {
      fs.mkdirSync(appFolder, { recursive: true });
    }

    const userDbPath = path.join(appFolder, 'database.json');

    // ✅ NUEVO: Copiar plantilla si no existe
    if (!fs.existsSync(userDbPath)) {
      this.copyTemplateDatabase(userDbPath);
    }

    return userDbPath;
  } else {
    // Desarrollo
    const devPath = path.join(process.cwd(), 'data');
    if (!fs.existsSync(devPath)) {
      fs.mkdirSync(devPath, { recursive: true });
    }
    return path.join(devPath, 'database.json');
  }
}

// ✅ NUEVO: Método para copiar plantilla
private copyTemplateDatabase(targetPath: string): void {
  try {
    const resourcesPath = process.env.RESOURCES_PATH ||
                          (process as any).resourcesPath;

    if (resourcesPath) {
      const templatePath = path.join(
        resourcesPath,
        'backend',
        'data',
        'database.json'
      );

      if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, targetPath);
        this.logger.log(`✅ Template database copied from: ${templatePath}`);
        return;
      }
    }

    this.logger.log('ℹ️ No template database found, will create default');
  } catch (error) {
    this.logger.warn(`⚠️ Could not copy template database: ${error.message}`);
  }
}
```

---

## 🎯 Ventajas de Este Enfoque

### ✅ Datos Iniciales

- La app viene con facilities y orders predefinidas
- Usuario no empieza con base de datos vacía
- Mejor experiencia de usuario

### ✅ Persistencia

- Datos del usuario se guardan en su carpeta personal
- No se pierden al actualizar la aplicación
- Cada usuario tiene su propia base de datos

### ✅ Actualizaciones

- Al actualizar la app, los datos del usuario se mantienen
- La plantilla solo se usa en la primera instalación
- No se sobrescriben datos existentes

### ✅ Portabilidad

- En Windows: `%APPDATA%/Production Processing/`
- En Mac: `~/Library/Application Support/Production Processing/`
- Ubicación estándar para cada sistema operativo

---

## 🧪 Probar Localmente

### Simular Primera Instalación

```bash
# 1. Compilar backend
cd nest-ui-be
npm run build

# 2. Verificar que data/database.json existe
ls data/database.json

# 3. Compilar Electron
cd ../nest-electron
npm run build
npm run dist:win

# 4. Verificar que se copió
# Buscar en: nest-electron/release/win-unpacked/resources/backend/data/
```

### Verificar en Producción

```powershell
# Después de instalar la app
# Abrir la ubicación de datos
explorer "%APPDATA%\Production Processing"

# Debería ver:
# - database.json (copiado de la plantilla)
```

---

## 📊 Logs del Backend

### Primera Ejecución

```
[DatabaseService] Database path: C:\Users\...\AppData\Roaming\Production Processing\database.json
[DatabaseService] ✅ Template database copied from: C:\...\resources\backend\data\database.json
[DatabaseService] ✅ Database loaded successfully
```

### Ejecuciones Posteriores

```
[DatabaseService] Database path: C:\Users\...\AppData\Roaming\Production Processing\database.json
[DatabaseService] ✅ Database loaded successfully
```

### Sin Plantilla (fallback)

```
[DatabaseService] Database path: C:\Users\...\AppData\Roaming\Production Processing\database.json
[DatabaseService] ℹ️ No template database found, will create default
[DatabaseService] ✅ Default database created
```

---

## 🔄 Migración de Datos

### Si el Usuario Ya Tiene Datos

La app respeta los datos existentes:

```
1. Usuario tiene: %APPDATA%/Production Processing/database.json
2. App actualizada incluye nueva plantilla
3. App detecta que ya existe database.json
4. NO sobrescribe
5. Usa datos existentes del usuario ✅
```

### Resetear a Valores por Defecto

Desde la app:

```typescript
// Endpoint disponible
POST / database / reset;
```

O manualmente:

```powershell
# Borrar base de datos del usuario
del "%APPDATA%\Production Processing\database.json"

# Al reiniciar la app, se copiará la plantilla nuevamente
```

---

## ✅ Checklist de Implementación

- [x] Agregar carpeta `data` a `extraResources` en `package.json`
- [x] Implementar `copyTemplateDatabase()` en `database.service.ts`
- [x] Actualizar `getDatabasePath()` para copiar plantilla
- [x] Verificar que `nest-ui-be/data/database.json` existe
- [x] Probar build local
- [ ] Probar en GitHub Actions
- [ ] Verificar en instalador final

---

## 🚀 Próximo Build

El próximo build incluirá:

- ✅ Carpeta `data` en `resources/backend/data/`
- ✅ Plantilla `database.json` con facilities y orders
- ✅ Copia automática en primera ejecución
- ✅ Persistencia en carpeta de usuario

```bash
git add nest-electron/package.json nest-ui-be/src/database/database.service.ts
git commit -m "feat: incluir base de datos inicial en instalador"
git push origin main
```
