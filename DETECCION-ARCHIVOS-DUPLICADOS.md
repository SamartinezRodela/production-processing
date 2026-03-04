# Detección de Archivos Duplicados

## Funcionalidad Implementada

He agregado la detección automática de archivos duplicados (archivos con el mismo nombre) que muestra un aviso en el Error Log cuando intentas agregar un archivo que ya existe en la lista.

## Cómo Funciona

### 1. Validación en el Servicio de Archivos

He agregado dos nuevos métodos en `file.service.ts`:

#### `isDuplicateFile(fileName: string): boolean`

Verifica si un archivo con el mismo nombre ya existe en la lista:

```typescript
isDuplicateFile(fileName: string): boolean {
  return this.selectedFiles().some(existingFile => existingFile.name === fileName);
}
```

**¿Qué hace?**

- Recorre todos los archivos en la lista actual
- Compara el nombre del archivo nuevo con los existentes
- Retorna `true` si encuentra un duplicado, `false` si no

#### `validateFileWithDuplicateCheck(file: File): FileValidationResult`

Valida el archivo incluyendo la verificación de duplicados:

```typescript
validateFileWithDuplicateCheck(file: File): FileValidationResult {
  // Primero validar tamaño y tipo
  const basicValidation = this.validateFile(file);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Verificar duplicados
  if (this.isDuplicateFile(file.name)) {
    return {
      isValid: false,
      error: `Duplicate file: "${file.name}" already exists in the list`,
    };
  }

  return { isValid: true };
}
```

**Orden de validación**:

1. Valida el tamaño del archivo
2. Valida el tipo de archivo
3. Verifica si es un duplicado
4. Si todo está bien, retorna `isValid: true`

### 2. Integración en el Servicio de Drop

He actualizado el método `validateAndAddFiles` en `file-drop.service.ts`:

```typescript
validateAndAddFiles(files: File[]): {
  valid: File[];
  invalid: Array<{ file: File; error: string }>;
} {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  files.forEach((file) => {
    // Usar la validación con verificación de duplicados
    const validation = this.fileService.validateFileWithDuplicateCheck(file);

    if (!validation.isValid) {
      invalid.push({ file, error: validation.error! });
    } else {
      valid.push(file);
    }
  });

  if (valid.length > 0) {
    this.fileService.addFiles(valid);
  }

  return { valid, invalid };
}
```

## Flujo de Validación

```
Usuario arrastra archivo "document.pdf"
    ↓
validateFileWithDuplicateCheck()
    ↓
┌─────────────────────────────────────┐
│ 1. Validar tamaño                   │
│    ✅ < 10MB                         │
├─────────────────────────────────────┤
│ 2. Validar tipo                     │
│    ✅ PDF válido                     │
├─────────────────────────────────────┤
│ 3. Verificar duplicados             │
│    ❌ "document.pdf" ya existe      │
└─────────────────────────────────────┘
    ↓
Retorna: { isValid: false, error: "Duplicate file..." }
    ↓
Se agrega al array de "invalid"
    ↓
Se muestra en Error Log ✅
```

## Ejemplos de Uso

### Escenario 1: Archivo Nuevo (No Duplicado)

```
Lista actual: []

Usuario arrastra: "report.pdf"
    ↓
Validación: ✅ Pasa todas las validaciones
    ↓
Resultado: Se agrega a la lista
    ↓
Lista actual: ["report.pdf"]
```

### Escenario 2: Archivo Duplicado

```
Lista actual: ["report.pdf"]

Usuario arrastra: "report.pdf" (mismo nombre)
    ↓
Validación: ❌ Duplicado detectado
    ↓
Error: "Duplicate file: 'report.pdf' already exists in the list"
    ↓
Resultado: Se muestra en Error Log
    ↓
Lista actual: ["report.pdf"] (sin cambios)
```

### Escenario 3: Múltiples Archivos con Duplicados

```
Lista actual: ["report.pdf", "invoice.pdf"]

Usuario arrastra: ["report.pdf", "contract.pdf", "invoice.pdf"]
    ↓
Validación:
  - "report.pdf" → ❌ Duplicado
  - "contract.pdf" → ✅ Nuevo
  - "invoice.pdf" → ❌ Duplicado
    ↓
Resultado:
  - Se agrega: "contract.pdf"
  - Error Log: 2 errores de duplicados
    ↓
Lista actual: ["report.pdf", "invoice.pdf", "contract.pdf"]
```

## Visualización en el Error Log

Cuando detecta un duplicado, verás algo como esto en el Error Log:

```
┌─────────────────────────────────────────────────────┐
│ Error Log                                           │
├─────────────────────────────────────────────────────┤
│ ⚠️ Error: report.pdf - Duplicate file: "report.pdf"│
│    already exists in the list                       │
│                                                     │
│ ⚠️ Error: invoice.pdf - Duplicate file:            │
│    "invoice.pdf" already exists in the list        │
└─────────────────────────────────────────────────────┘
```

## Testing

### Test 1: Agregar Archivo Nuevo

1. Arrastra un archivo "document.pdf"
2. **Verifica**: Se agrega a la lista correctamente
3. **Verifica**: No hay errores en el Error Log

### Test 2: Agregar Archivo Duplicado

1. Arrastra un archivo "document.pdf"
2. Arrastra el MISMO archivo "document.pdf" otra vez
3. **Verifica**: El segundo intento NO se agrega
4. **Verifica**: Aparece error en Error Log:
   ```
   Duplicate file: "document.pdf" already exists in the list
   ```

### Test 3: Múltiples Archivos con Duplicados

1. Arrastra 3 archivos: "file1.pdf", "file2.pdf", "file3.pdf"
2. Arrastra 2 archivos: "file1.pdf", "file4.pdf"
3. **Verifica**: Solo "file4.pdf" se agrega
4. **Verifica**: Error Log muestra:
   ```
   Duplicate file: "file1.pdf" already exists in the list
   ```
5. **Verifica**: Lista final tiene 4 archivos (file1, file2, file3, file4)

### Test 4: Limpiar y Volver a Agregar

1. Arrastra "document.pdf"
2. Click en "Clear all"
3. Arrastra "document.pdf" otra vez
4. **Verifica**: Se agrega correctamente (ya no es duplicado)
5. **Verifica**: No hay errores

### Test 5: Eliminar y Volver a Agregar

1. Arrastra "document.pdf"
2. Click en el botón "X" para eliminar
3. Arrastra "document.pdf" otra vez
4. **Verifica**: Se agrega correctamente
5. **Verifica**: No hay errores

## Comparación de Nombres

La detección de duplicados compara el nombre COMPLETO del archivo, incluyendo la extensión:

```typescript
// Estos son DIFERENTES (no duplicados)
"document.pdf";
"document.docx";
"Document.pdf"; // Nota: Mayúscula vs minúscula

// Estos son IGUALES (duplicados)
"document.pdf";
"document.pdf";
```

**Nota**: La comparación es case-sensitive (distingue mayúsculas y minúsculas).

## Personalización

### Cambiar el Mensaje de Error

Si quieres personalizar el mensaje de error, edita en `file.service.ts`:

```typescript
if (this.isDuplicateFile(file.name)) {
  return {
    isValid: false,
    error: `El archivo "${file.name}" ya está en la lista`, // ← Personalizado
  };
}
```

### Permitir Duplicados con Advertencia

Si quieres permitir duplicados pero mostrar una advertencia:

```typescript
validateFileWithDuplicateCheck(file: File): FileValidationResult {
  const basicValidation = this.validateFile(file);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  if (this.isDuplicateFile(file.name)) {
    // Mostrar advertencia pero permitir agregar
    console.warn(`⚠️ Duplicate file: ${file.name}`);
    // No retornar error, continuar
  }

  return { isValid: true };
}
```

### Agregar Sufijo Automático

Si quieres agregar un sufijo automático a los duplicados (ej: "document (1).pdf"):

```typescript
addFiles(files: File[]): void {
  const processedFiles = files.map(file => {
    if (this.isDuplicateFile(file.name)) {
      // Agregar sufijo
      const nameParts = file.name.split('.');
      const extension = nameParts.pop();
      const baseName = nameParts.join('.');
      let counter = 1;
      let newName = `${baseName} (${counter}).${extension}`;

      while (this.isDuplicateFile(newName)) {
        counter++;
        newName = `${baseName} (${counter}).${extension}`;
      }

      // Crear nuevo File con nombre modificado
      return new File([file], newName, { type: file.type });
    }
    return file;
  });

  this.selectedFiles.set([...this.selectedFiles(), ...processedFiles]);
}
```

## Validaciones Actuales

El sistema ahora valida:

1. ✅ **Tamaño del archivo**: Máximo 10MB
2. ✅ **Tipo de archivo**: Solo PDF, PNG, JPG
3. ✅ **Archivos duplicados**: No permite mismo nombre

## Orden de Validación

```
1. Tamaño → Si falla, retorna error de tamaño
2. Tipo → Si falla, retorna error de tipo
3. Duplicado → Si falla, retorna error de duplicado
4. Todo OK → Archivo se agrega a la lista
```

## Beneficios

- ✅ Evita archivos duplicados en la lista
- ✅ Informa al usuario claramente qué archivo es duplicado
- ✅ Mantiene la lista limpia y organizada
- ✅ Previene procesamiento redundante
- ✅ Fácil de identificar en el Error Log

## Resumen de Cambios

### Archivo: `file.service.ts`

1. ✅ Agregado método `isDuplicateFile()`
2. ✅ Agregado método `validateFileWithDuplicateCheck()`

### Archivo: `file-drop.service.ts`

1. ✅ Actualizado `validateAndAddFiles()` para usar la nueva validación

### Resultado

- ✅ Detección automática de duplicados
- ✅ Mensajes claros en Error Log
- ✅ Sin cambios en la UI (funciona automáticamente)

---

**Estado**: Funcionalidad implementada ✅
**Requiere reinicio**: Sí (cambios en TypeScript)
**Requiere limpiar caché**: Sí (`Ctrl + Shift + R`)

## Próximos Pasos

1. **Reinicia el servidor de desarrollo**
2. **Limpia la caché del navegador** (`Ctrl + Shift + R`)
3. **Prueba arrastrando un archivo**
4. **Arrastra el mismo archivo otra vez**
5. **Verifica el Error Log**: Debe mostrar el error de duplicado

¡Ahora el sistema detecta y previene archivos duplicados automáticamente! 🎉
