# Historia de Usuario: Integración de la Ruta de Salida

## Estado: ✅ COMPLETADA

## Historia de Usuario Original

**COMO** usuario de producción  
**QUIERO** seleccionar una ruta de salida para los archivos procesados  
**PARA** que los resultados del Nesting se guarden en el lugar correcto

### Incluye

- ✅ Selector de carpeta OutputPath
- ✅ Navegación para Selección de Path
- ✅ Copy-paste de path
- ✅ Validación de permisos de escritura

### Excluye

- ❌ Escritura en rutas sin permisos
- ❌ Procesamiento de Nesting (se cubre en otra historia)

### Asume

El usuario selecciona una ruta válida y con permisos de escritura.

---

## Criterios de Aceptación

### ✅ Escenario 1: Selección de OutputPath

**Dado que** el usuario requiere definir la ruta de salida  
**Cuando** selecciona una carpeta desde el explorador  
**Entonces** el sistema debe:

- Validar que la carpeta existe
- Validar que tiene permisos de escritura
- Guardar esa ruta si es válida
- Mostrarla en la interfaz
- Mostrar error si no tiene permisos

**Implementación:**

- Botón "Browse" en Output Path section
- Validación backend con `fs.accessSync(path, fs.constants.W_OK)`
- Notificación de éxito/error

### ✅ Escenario 2: Copy-Paste de OutputPath

**Dado que** el usuario requiere definir la ruta de salida  
**Cuando** pega la ruta directamente en el input  
**Entonces** el sistema debe:

- Validar la ruta cuando pierde el foco (blur)
- Guardar esa ruta si es válida
- Mostrarla en la interfaz
- Mostrar error si no es válida

**Implementación:**

- Evento `(blur)` en el input de Output Path
- Método `onOutputPathBlur()` que valida automáticamente
- Notificación de éxito/error

### ✅ Escenario 3: Ruta inválida Copy-Paste

**Dado que** el usuario puede pegar la ruta directamente  
**Cuando** el sistema valida la ruta  
**Entonces** debe mostrar un mensaje de error con:

- Razón del error (no existe, no es directorio, sin permisos)
- Instrucciones para corregir

**Implementación:**

- Validación en blur del input
- Validación antes de guardar settings
- Mensajes de error descriptivos

---

## Implementación Técnica

### 1. Backend - Validación de Paths

**Archivo:** `nest-ui-be/src/settings/settings.service.ts`

```typescript
validatePath(pathToValidate: string, type: 'read' | 'write' | 'both'): {
  valid: boolean;
  exists: boolean;
  canRead: boolean;
  canWrite: boolean;
  error?: string;
}
```

**Validaciones:**

- ✅ Path existe
- ✅ Es un directorio
- ✅ Tiene permisos de lectura (para Base Path)
- ✅ Tiene permisos de escritura (para Output Path)

**Endpoint:** `POST /settings/validate-path`

### 2. Frontend - Componente Input

**Archivo:** `nest-ui-fe/src/app/components/shared/input/input.ts`

**Cambios:**

- ✅ Agregado `blur = output<void>()` para emitir evento blur
- ✅ Agregado método `onBlur()` que emite el evento
- ✅ Agregado `(blur)="onBlur()"` en el template HTML

### 3. Frontend - Página Settings

**Archivo:** `nest-ui-fe/src/app/pages/set-up/set-up.ts`

**Métodos agregados:**

#### `onBasePathBlur()`

- Valida Base Path cuando el usuario termina de escribir/pegar
- Requiere permisos de lectura
- Muestra notificación de éxito/error

#### `onOutputPathBlur()`

- Valida Output Path cuando el usuario termina de escribir/pegar
- Requiere permisos de escritura
- Muestra notificación de éxito/error

#### `save()` - Mejorado

- Valida ambos paths antes de guardar
- Bloquea el guardado si algún path es inválido
- Muestra error descriptivo

### 4. Frontend - Template HTML

**Archivo:** `nest-ui-fe/src/app/pages/set-up/set-up.html`

**Cambios:**

```html
<!-- Base Path Input -->
<app-input [(value)]="basePath" (blur)="onBasePathBlur()" ... />

<!-- Output Path Input -->
<app-input [(value)]="outputPath" (blur)="onOutputPathBlur()" ... />
```

---

## Flujos de Validación

### Flujo 1: Selección con Browse

1. Usuario hace click en "Browse"
2. Selecciona carpeta en explorador
3. Sistema valida permisos inmediatamente
4. Si válido: guarda y muestra notificación de éxito
5. Si inválido: muestra error y no guarda

### Flujo 2: Copy-Paste Manual

1. Usuario pega/escribe ruta en el input
2. Usuario hace click fuera del input (blur)
3. Sistema valida permisos automáticamente
4. Muestra notificación de éxito/error
5. Ruta se mantiene en el input (usuario puede corregir)

### Flujo 3: Validación al Guardar

1. Usuario hace click en "Save Settings"
2. Sistema valida ambos paths antes de guardar
3. Si alguno es inválido: bloquea guardado y muestra error
4. Si ambos son válidos: guarda en backend

---

## Mensajes de Error

### Tipos de Error:

1. **Path does not exist** - La ruta no existe en el sistema
2. **Path is not a directory** - La ruta apunta a un archivo, no carpeta
3. **No read permission** - Sin permisos de lectura (Base Path)
4. **No write permission** - Sin permisos de escritura (Output Path)
5. **Failed to validate path** - Error de comunicación con backend

### Formato de Notificación:

```
❌ Invalid Output Path: No write permission for this path.
   Please select a folder with write permissions.
```

---

## Logs de Debug

### Frontend (Console del navegador):

```
🔍 Validating Output Path on blur: C:\Test
🌐 Sending validation request to backend...
📥 Received validation response from backend: {...}
✅ Output Path validation passed!
```

### Backend (Terminal NestJS):

```
🔍 Validating path: C:\Test
📋 Validation type: write
📁 Path exists: true
📂 Is directory: true
✅ Read permission: YES
✅ Write permission: YES
📊 Validation result: { valid: true, ... }
```

---

## Testing

### Casos de Prueba:

#### Test 1: Browse con carpeta válida

- ✅ Seleccionar carpeta con permisos
- ✅ Debe guardar y mostrar éxito

#### Test 2: Browse con carpeta sin permisos

- ✅ Seleccionar carpeta sin permisos de escritura
- ✅ Debe mostrar error y no guardar

#### Test 3: Copy-Paste ruta válida

- ✅ Pegar ruta válida en input
- ✅ Hacer blur (click fuera)
- ✅ Debe validar y mostrar éxito

#### Test 4: Copy-Paste ruta inválida

- ✅ Pegar ruta que no existe
- ✅ Hacer blur
- ✅ Debe mostrar error

#### Test 5: Guardar con rutas inválidas

- ✅ Intentar guardar con Output Path inválido
- ✅ Debe bloquear guardado y mostrar error

---

## Archivos Modificados

### Backend:

- `nest-ui-be/src/settings/settings.service.ts` - Validación de paths
- `nest-ui-be/src/settings/settings.controller.ts` - Endpoint validate-path

### Frontend:

- `nest-ui-fe/src/app/components/shared/input/input.ts` - Evento blur
- `nest-ui-fe/src/app/components/shared/input/input.html` - Template blur
- `nest-ui-fe/src/app/pages/set-up/set-up.ts` - Validación copy-paste
- `nest-ui-fe/src/app/pages/set-up/set-up.html` - Eventos blur

---

## Notas Importantes

### Permisos en Windows:

- Las reglas DENY siempre tienen precedencia sobre ALLOW
- Para probar, asegurarse de NO tener checkboxes en columna "Denegar"
- Solo usar checkboxes en columna "Permitir"

### Validación No Bloqueante:

- La validación en blur NO revierte el valor del input
- Permite al usuario corregir la ruta sin perder lo escrito
- La validación en save() SÍ bloquea el guardado

### UX Considerations:

- Validación inmediata en Browse (antes de guardar)
- Validación diferida en Copy-Paste (al perder foco)
- Validación final en Save (antes de persistir)
- Mensajes claros y descriptivos en cada caso

---

## ✨ Mejora Adicional: Quick Path Editor en Home

### Descripción

Se agregó una sección minimalista en la página Home para editar rápidamente los paths sin necesidad de ir a Settings.

### Características:

- **Diseño minimalista**: Una sola línea con ambos paths lado a lado
- **Edición inline**: Input fields con validación en blur
- **Botones Browse**: Acceso rápido al explorador de carpetas
- **Validación automática**: Al escribir/pegar o usar Browse
- **Auto-guardado**: Los cambios se guardan automáticamente al validar
- **Feedback visual**:
  - Icono de carpeta gris para Base Path
  - Icono de carpeta verde para Output Path
  - Divider vertical entre ambos paths

### Ubicación:

Después del warning banner y antes de los filtros de Facility/Process Type

### UI/UX:

```
┌──────────────────────────────────────────────────────────────────────┐
│ 📁 Base Path                      │  📁 Output Path                  │
│ [C:\Production\Files........] [📂] │  [C:\Production\Output.....] [📂]│
└──────────────────────────────────────────────────────────────────────┘
```

### Implementación Técnica:

**Archivo:** `nest-ui-fe/src/app/pages/home/home.html`

```html
<div class="bg-white dark:bg-gray-800 border rounded-lg p-4 mb-6">
  <div class="flex items-center gap-6">
    <!-- Base Path -->
    <div class="flex-1 flex items-center gap-2">
      <app-icon name="folder" size="16" />
      <div class="flex-1">
        <label class="text-xs">Base Path</label>
        <app-input [(value)]="basePath" (blur)="onBasePathBlur()" />
      </div>
      <app-button icon="folder-open" (clicked)="browsePath()" />
    </div>

    <!-- Divider -->
    <div class="w-px h-12 bg-gray-200"></div>

    <!-- Output Path -->
    <div class="flex-1 flex items-center gap-2">
      <app-icon name="folder" size="16" class="text-green-500" />
      <div class="flex-1">
        <label class="text-xs">Output Path</label>
        <app-input [(value)]="outputPath" (blur)="onOutputPathBlur()" />
      </div>
      <app-button icon="folder-open" (clicked)="browseOutputPath()" />
    </div>
  </div>
</div>
```

**Archivo:** `nest-ui-fe/src/app/pages/home/home.ts`

**Métodos agregados:**

- `browsePath()`: Abre explorador para Base Path
- `browseOutputPath()`: Abre explorador para Output Path
- `onBasePathBlur()`: Valida Base Path al perder foco
- `onOutputPathBlur()`: Valida Output Path al perder foco
- `validatePath()`: Llama al backend para validar permisos
- `savePathSettings()`: Guarda paths en backend automáticamente

**Getters agregados:**

- `basePath()`: Retorna signal de Base Path desde SettingsService
- `outputPath()`: Retorna signal de Output Path desde SettingsService

### Flujo de Usuario:

1. **Edición con Browse:**
   - Usuario hace click en botón 📂
   - Se abre explorador de carpetas
   - Selecciona carpeta
   - Sistema valida permisos
   - Si válido: guarda automáticamente y muestra notificación
   - Si inválido: muestra error y no guarda

2. **Edición con Copy-Paste:**
   - Usuario pega/escribe ruta en input
   - Usuario hace click fuera del input (blur)
   - Sistema valida permisos automáticamente
   - Si válido: guarda automáticamente y muestra notificación
   - Si inválido: muestra error pero mantiene el valor (usuario puede corregir)

3. **Actualización automática:**
   - Al guardar paths, se actualiza el warning banner
   - Se reinicia el folder watcher con el nuevo Output Path
   - Los cambios se reflejan inmediatamente en toda la aplicación

### Ventajas:

- ✅ Acceso rápido sin salir de Home
- ✅ Menos clicks para configurar paths
- ✅ Validación inmediata con feedback visual
- ✅ Auto-guardado elimina necesidad de botón "Save"
- ✅ Diseño minimalista que no ocupa mucho espacio
- ✅ Consistente con la validación de Settings page

### Archivos Modificados:

- `nest-ui-fe/src/app/pages/home/home.html` - UI del quick editor
- `nest-ui-fe/src/app/pages/home/home.ts` - Lógica de validación y guardado
- `nest-ui-fe/src/app/components/shared/input/input.ts` - Soporte para evento blur
- `nest-ui-fe/src/app/components/shared/input/input.html` - Template con blur event

### Testing:

- ✅ Browse con carpeta válida
- ✅ Browse con carpeta sin permisos
- ✅ Copy-paste ruta válida + blur
- ✅ Copy-paste ruta inválida + blur
- ✅ Auto-guardado después de validación exitosa
- ✅ Warning banner se actualiza después de cambiar paths
- ✅ Folder watcher se reinicia con nuevo Output Path
