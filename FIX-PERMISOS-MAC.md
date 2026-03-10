# Fix: Permisos de Acceso a Carpetas en macOS

## Problema

En Mac, la aplicación no puede:

- Cambiar carpetas (Base Path / Output Path)
- Guardar datos en database.json
- Leer archivos de carpetas seleccionadas
- Error: "Invalid read permission"

**En Windows funciona correctamente.**

## Causa Raíz

macOS tiene restricciones de seguridad más estrictas que Windows:

1. **Sandboxing**: Las apps deben declarar explícitamente qué permisos necesitan
2. **Entitlements**: Permisos específicos para acceder a carpetas del usuario
3. **Privacy Prompts**: El usuario debe autorizar el acceso a ciertas ubicaciones

Sin estos permisos, la app no puede:

- Acceder a carpetas fuera de su contenedor
- Leer/escribir archivos en ubicaciones del usuario
- Usar el diálogo de selección de carpetas efectivamente

## Solución Aplicada

### 1. Entitlements (Permisos)

Creado `nest-electron/build/entitlements.mac.plist`:

```xml
<key>com.apple.security.files.user-selected.read-write</key>
<true/>
<!-- Permite acceso a archivos seleccionados por el usuario -->

<key>com.apple.security.files.downloads.read-write</key>
<true/>
<!-- Permite acceso a carpeta de descargas -->

<key>com.apple.security.files.user-selected.read-only</key>
<true/>
<!-- Permite lectura de archivos seleccionados -->

<key>com.apple.security.network.client</key>
<true/>
<!-- Permite conexiones de red (backend) -->

<key>com.apple.security.cs.disable-library-validation</key>
<true/>
<!-- Permite Python embebido sin firma -->
```

### 2. Info.plist (Descripciones de Permisos)

Creado `nest-electron/build/Info.plist`:

```xml
<key>NSDocumentsFolderUsageDescription</key>
<string>Production Processing needs access to your documents folder to read and process files.</string>

<key>NSDownloadsFolderUsageDescription</key>
<string>Production Processing needs access to your downloads folder to read and process files.</string>
```

Estas descripciones se muestran al usuario cuando la app solicita permisos.

### 3. Configuración de Electron Builder

Actualizado `nest-electron/package.json`:

```json
"mac": {
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "build/entitlements.mac.plist",
  "entitlementsInherit": "build/entitlements.mac.plist",
  "extendInfo": "build/Info.plist"
}
```

### 4. Mejora del Diálogo de Selección

Actualizado `nest-electron/src/main.ts`:

```typescript
const dialogOptions: any = {
  properties: ["openDirectory"],
  title: "Select Base Path Folder",
};

// En Mac, agregar opciones adicionales
if (isMac) {
  dialogOptions.properties.push("createDirectory");
  dialogOptions.message = "Select a folder to access files";
  dialogOptions.buttonLabel = "Select Folder";
}

// Verificar acceso después de seleccionar
if (isMac) {
  fs.readdirSync(selectedPath); // Verifica que tenemos acceso
}
```

## Permisos Incluidos

| Permiso                               | Descripción                          | Necesario Para         |
| ------------------------------------- | ------------------------------------ | ---------------------- |
| `files.user-selected.read-write`      | Leer/escribir archivos seleccionados | Base Path, Output Path |
| `files.downloads.read-write`          | Acceso a carpeta Downloads           | Guardar PDFs           |
| `network.client`                      | Conexiones salientes                 | Backend NestJS         |
| `network.server`                      | Conexiones entrantes                 | Backend NestJS         |
| `cs.disable-library-validation`       | Ejecutar Python sin firma            | Python embebido        |
| `cs.allow-jit`                        | JIT compilation                      | Python                 |
| `cs.allow-unsigned-executable-memory` | Memoria ejecutable                   | Python                 |

## Cómo Funciona en Mac

### Primera Vez que Seleccionas una Carpeta

1. Usuario hace clic en "Browse" para Base Path
2. Se abre el diálogo de selección de carpetas
3. Usuario selecciona una carpeta (ej: `/Users/usuario/Documents/Production`)
4. macOS pregunta: "¿Permitir que Production Processing acceda a esta carpeta?"
5. Usuario hace clic en "OK"
6. La app ahora tiene acceso a esa carpeta específica

### Permisos Persistentes

macOS recuerda los permisos otorgados:

- Los permisos se guardan en el sistema
- No necesitas volver a autorizar cada vez
- Los permisos persisten entre reinicios

### Revocar Permisos

Si quieres revocar permisos:

```
System Settings → Privacy & Security → Files and Folders → Production Processing
```

## Testing en Mac

### Test 1: Seleccionar Base Path

1. Abrir la app
2. Ir a Settings
3. Click en "Browse" para Base Path
4. Seleccionar una carpeta
5. Verificar que no hay error "Invalid read permission"

### Test 2: Guardar Settings

1. Cambiar Base Path o Output Path
2. Click en "Save"
3. Verificar en logs que se guardó:

```
💾 Guardando base de datos en: ~/Library/Application Support/Production Processing/database.json
✅ Base de datos guardada exitosamente
```

### Test 3: Leer Archivos

1. Seleccionar una carpeta con archivos
2. Verificar que la app puede listar los archivos
3. No debe haber errores de permisos

## Diferencias Windows vs Mac

| Aspecto          | Windows           | Mac                    |
| ---------------- | ----------------- | ---------------------- |
| **Permisos**     | Menos restrictivo | Muy restrictivo        |
| **Entitlements** | No necesarios     | Obligatorios           |
| **Diálogos**     | Acceso inmediato  | Requiere autorización  |
| **Persistencia** | Automática        | Requiere configuración |
| **Sandboxing**   | Opcional          | Recomendado            |

## Problemas Conocidos

### Problema 1: "Operation not permitted"

**Causa:** La app no tiene permisos para acceder a la carpeta

**Solución:**

1. Reinstalar la app (con los nuevos entitlements)
2. Seleccionar la carpeta de nuevo
3. Autorizar cuando macOS pregunte

### Problema 2: Permisos no persisten

**Causa:** La app no está firmada correctamente

**Solución:**

- Los entitlements solo funcionan con apps firmadas
- Para desarrollo: `identity: null` (sin firma)
- Para producción: Necesitas Apple Developer ID

### Problema 3: "App is damaged"

**Causa:** Gatekeeper bloquea la app

**Solución:**

```bash
# Remover quarantine
xattr -cr "/Applications/Production Processing.app"

# O deshabilitar Gatekeeper temporalmente
sudo spctl --master-disable
```

## Próximo Build

El próximo instalador de Mac incluirá:

- ✅ Entitlements para acceso a carpetas
- ✅ Info.plist con descripciones de permisos
- ✅ Diálogo mejorado de selección
- ✅ Verificación de acceso después de seleccionar
- ✅ Hardened Runtime habilitado

## Commits Relacionados

- `a2b16bd` - fix: agregar permisos de acceso a carpetas para macOS

## Referencias

- Apple Entitlements: https://developer.apple.com/documentation/bundleresources/entitlements
- File Access: https://developer.apple.com/documentation/security/app_sandbox/accessing_files_from_the_macos_app_sandbox
- Electron Builder Mac: https://www.electron.build/configuration/mac
- Archivos modificados:
  - `nest-electron/build/entitlements.mac.plist`
  - `nest-electron/build/Info.plist`
  - `nest-electron/package.json`
  - `nest-electron/src/main.ts`
