# Fix: Validación de Rutas en Python Tests

## Problema Identificado

Los tests de PyPDF y PyMuPDF estaban encontrando PDFs en ubicaciones incorrectas (`C:\Projects\NEST-UI-V2\Base_Files\`) en lugar de usar el `basePath` configurado en Settings (`C:\Users\samartinez\Documents\BasePath`).

## Causa Raíz

1. El directorio `basePath` configurado no existía o no contenía archivos PDF
2. No había validación clara que alertara al usuario sobre problemas de configuración
3. Los errores no eran lo suficientemente descriptivos

## Solución Implementada

### 1. Backend - Validación Estricta de Rutas

**Archivo**: `nest-ui-be/src/python/python.service.ts`

#### Método `buildOutputPath()` - Validación de OutputPath

```typescript
private buildOutputPath(fileName: string): string {
  const settings = this.settingsService.getSettings();
  const outputPath = settings.outputPath;

  // Validar que outputPath esté configurado
  if (!outputPath || outputPath.trim() === '') {
    throw new Error('OutputPath is not configured. Please configure it in Settings...');
  }

  // Validar que outputPath exista
  if (!fs.existsSync(outputPath)) {
    throw new Error(`OutputPath does not exist: ${outputPath}...`);
  }

  return path.join(outputPath, fileName);
}
```

#### Métodos `testPyPDF()` y `testPyMuPDF()` - Validación de BasePath

```typescript
async testPyPDF(pdfPath?: string): Promise<any> {
  if (!pdfPath) {
    const basePath = settings.basePath;

    // Validar que basePath esté configurado
    if (!basePath || basePath.trim() === '') {
      throw new Error('BasePath is not configured...');
    }

    // Validar que basePath exista
    if (!fs.existsSync(basePath)) {
      throw new Error(`BasePath does not exist: ${basePath}...`);
    }

    // Buscar PDFs y validar que existan
    const files = fs.readdirSync(basePath);
    const pdfFile = files.find(file => file.toLowerCase().endsWith('.pdf'));

    if (!pdfFile) {
      throw new Error(`No PDF files found in basePath: ${basePath}...`);
    }

    fullPath = path.join(basePath, pdfFile);
  }

  return this.executeScript('test_pypdf.py', [fullPath]);
}
```

#### Nuevo Método `verifyPathsConfiguration()`

Endpoint: `GET /python/verify-paths`

Verifica y retorna información detallada sobre:

- ✅ Si `basePath` está configurado
- ✅ Si el directorio existe
- ✅ Si tiene permisos de lectura/escritura
- ✅ Cuántos archivos PDF contiene
- ✅ Si `outputPath` está configurado
- ✅ Si el directorio existe
- ✅ Si tiene permisos de escritura

### 2. Frontend - Validación Visual

**Archivo**: `nest-ui-fe/src/app/pages/python-tests/python-tests.component.ts`

#### Verificación Automática al Cargar

```typescript
ngOnInit(): void {
  // Verificar rutas al cargar el componente
  this.verifyPathsConfiguration();
}
```

#### Método `verifyPathsConfiguration()`

```typescript
async verifyPathsConfiguration(): Promise<void> {
  this.pathsVerification = await this.pythonTestService.verifyPaths().toPromise();

  // Mostrar notificaciones según el estado
  if (!this.pathsVerification.summary.ready) {
    // Alertas específicas para cada problema
  }
}
```

### 3. UI - Banner de Configuración Mejorado

**Archivo**: `nest-ui-fe/src/app/pages/python-tests/python-tests.component.html`

Ahora muestra:

- ✅ Estado detallado de `basePath` (configurado, existe, legible, cantidad de PDFs)
- ✅ Estado detallado de `outputPath` (configurado, existe, escribible)
- ✅ Badges de estado (OK / Error)
- ✅ Mensajes de error específicos
- ✅ Botón "Refresh Status" para re-verificar
- ✅ Botón "Go to Settings" para configurar

### 4. Fix de Iconos

**Cambio**: `'close'` → `'x'`

El icono `'close'` no existe en el iconMap, se cambió a `'x'` que es el correcto.

## Flujo de Validación

```
1. Usuario abre Python Tests
   ↓
2. ngOnInit() llama a verifyPathsConfiguration()
   ↓
3. Backend verifica:
   - basePath configurado? ❌ → Error
   - basePath existe? ❌ → Error
   - basePath tiene PDFs? ❌ → Warning
   - outputPath configurado? ❌ → Error
   - outputPath exia rutas correctas
   ↓
7. Usuario regresa y hace clic en "Refresh Status"
   ↓
8. ✅ Todo OK → Puede ejecutar tests
```

## Mensajes de Error Mejorados

### Antes

```
Error: BasePath not configured or does not exist
```

### Ahora

```
❌ BasePath is not configured. Please configure it in Settings before running PDF tests.
❌ BasePath does not exist: C:\Users\samartinez\Documents\BasePath. Please create the directory or update the path in Settings.
❌ No PDF files found in basePath: C:\Users\samartinez\Documents\BasePath. Please add at least one PDF file to this directory.
```

## Archivos Modificados

1. `nest-ui-be/src/python/python.service.ts`
   - Validación estricta en `buildOutputPath()`
   - Validación estricta en `testPyPDF()` y `testPyMuPDF()`
   - Nuevo método `verifyPathsConfiguration()`

2. `nest-ui-be/src/python/python.controller.ts`
   - Nuevo endpoint `GET /python/verify-paths`

3. `nest-ui-fe/src/app/service/python-test.service.ts`
   - Nuevo método `verifyPaths()`

4. `nest-ui-fe/src/app/pages/python-tests/python-tests.component.ts`
   - Verificación automática en `ngOnInit()`
   - Nuevo método `verifyPathsConfiguration()`
   - Fix de icono: `'close'` → `'x'`

5. `nest-ui-fe/src/app/pages/python-tests/python-tests.component.html`
   - Banner de configuración mejorado con estado detallado
   - Botones "Refresh Status" y "Go to Settings"

## Próximos Pasos para el Usuario

1. **Crear el directorio BasePath**:

   ```bash
   mkdir "C:\Users\samartinez\Documents\BasePath"
   ```

2. **Copiar archivos PDF al BasePath**:

   ```bash
   copy "C:\Projects\NEST-UI-V2\Base_Files\*.pdf" "C:\Users\samartinez\Documents\BasePath\"
   ```

3. **Crear el directorio OutputPath**:

   ```bash
   mkdir "C:\Users\samartinez\Documents\OutputPath"
   ```

4. **Verificar en la UI**:
   - Abrir Python Tests
   - Verificar que el banner muestre "OK" para ambas rutas
   - Ejecutar tests

## Resultado Esperado

Ahora el sistema:

- ✅ Valida rutas antes de ejecutar tests
- ✅ Muestra errores claros y específicos
- ✅ Guía al usuario para solucionar problemas
- ✅ Usa SIEMPRE las rutas configuradas en Settings
- ✅ No tiene fallbacks silenciosos a rutas incorrectas
  ste? ❌ → Error
  - outputPath escribible? ❌ → Error
    ↓

4. Frontend muestra banner con estado detallado
   ↓
5. Usuario hace clic en "Go to Settings" para configurar
   ↓
6. Usuario configur

```

```
