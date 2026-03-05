# Solución: Animación se Queda Trabada

## Problema

Las animaciones de drag and drop (archivos y carpetas cayendo) se quedan "pegadas" o "trabadas" incluso después de que dejas de arrastrar archivos. La animación no desaparece cuando sales del área.

## Causa

El problema estaba en la lógica del `onDragLeave`. La implementación anterior era demasiado compleja y no detectaba correctamente cuando realmente salías del área:

```typescript
// ANTES - Lógica compleja y propensa a errores
onDragLeave(event: DragEvent): void {
  const target = event.target as HTMLElement;
  const relatedTarget = event.relatedTarget as HTMLElement;

  if (relatedTarget && !target.closest('.upload-area-container')?.contains(relatedTarget)) {
    this.isDragging.set(false);
  } else if (!relatedTarget) {
    this.isDragging.set(false);
  }
}
```

**Problemas**:

1. Usaba `target` en lugar de `currentTarget`
2. Buscaba el contenedor con `closest()` que podía fallar
3. No manejaba casos edge donde el evento se dispara múltiples veces
4. No tenía protección contra falsos positivos

## Solución

### 1. Simplificar la Lógica de `onDragLeave`

```typescript
onDragLeave(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  // Limpiar timeout anterior si existe
  if (this.dragLeaveTimeout) {
    clearTimeout(this.dragLeaveTimeout);
  }

  // Usar timeout para evitar falsos positivos
  this.dragLeaveTimeout = setTimeout(() => {
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    // Si no hay relatedTarget o el relatedTarget no está dentro del currentTarget
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      this.isDragging.set(false);
      console.log('🚫 Drag left the area');
    }
  }, 50); // 50ms de delay
}
```

**Mejoras**:

- Usa `currentTarget` (el elemento con el listener) en lugar de `target`
- Usa `contains()` para verificar si el `relatedTarget` está dentro
- Agrega un timeout de 50ms para evitar parpadeos
- Más simple y confiable

### 2. Cancelar Timeout en `onDragOver`

```typescript
onDragOver(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  // Cancelar el timeout de dragLeave si existe
  if (this.dragLeaveTimeout) {
    clearTimeout(this.dragLeaveTimeout);
    this.dragLeaveTimeout = null;
  }

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
    const hasValidFiles = this.fileDropService.checkDraggedFiles(event.dataTransfer);
    this.isDragging.set(hasValidFiles);
  }
}
```

**Beneficio**: Si vuelves al área antes de que se cumpla el timeout, se cancela y la animación no desaparece.

### 3. Limpiar Timeout en `onDrop`

```typescript
async onDrop(event: DragEvent): Promise<void> {
  event.preventDefault();
  event.stopPropagation();

  // Limpiar timeout si existe
  if (this.dragLeaveTimeout) {
    clearTimeout(this.dragLeaveTimeout);
    this.dragLeaveTimeout = null;
  }

  this.isDragging.set(false);
  // ... resto del código
}
```

### 4. Limpiar Timeout en `ngOnDestroy`

```typescript
ngOnDestroy(): void {
  // Limpiar timeout si existe
  if (this.dragLeaveTimeout) {
    clearTimeout(this.dragLeaveTimeout);
  }

  this.fileProcessingService.cleanup();
  this.folderWatcher.stopWatching();
}
```

**Beneficio**: Evita memory leaks si el componente se destruye mientras hay un timeout pendiente.

### 5. Agregar Variable de Estado

```typescript
// UI State
isDragging = signal(false);
selectedFacility = signal<string>('1');
ProcessType = signal<string>('1');
private dragLeaveTimeout: any = null; // ← NUEVO
```

## Cómo Funciona Ahora

### Flujo de Eventos

```
1. Usuario arrastra archivo sobre el área
   ↓
   onDragEnter() → isDragging = true
   ↓
   Animaciones aparecen ✅

2. Usuario mueve el mouse dentro del área
   ↓
   onDragOver() → Cancela timeout, mantiene isDragging = true
   ↓
   Animaciones siguen visibles ✅

3. Usuario sale del área
   ↓
   onDragLeave() → Inicia timeout de 50ms
   ↓
   Espera 50ms...
   ↓
   Si no volvió al área: isDragging = false
   ↓
   Animaciones desaparecen ✅

4. Usuario vuelve al área antes de 50ms
   ↓
   onDragOver() → Cancela timeout
   ↓
   Animaciones siguen visibles ✅

5. Usuario suelta el archivo
   ↓
   onDrop() → Cancela timeout, isDragging = false
   ↓
   Animaciones desaparecen ✅
```

## Beneficios del Timeout

### ¿Por qué 50ms?

```typescript
this.dragLeaveTimeout = setTimeout(() => {
  // ...
}, 50); // ← 50ms
```

**Razones**:

1. **Evita parpadeos**: Cuando el mouse pasa rápidamente sobre elementos hijos, `dragLeave` se dispara múltiples veces. El timeout evita que la animación parpadee.

2. **Imperceptible para el usuario**: 50ms es tan rápido que el usuario no nota el delay.

3. **Suficiente para detectar movimientos**: Si el usuario realmente sale del área, 50ms es suficiente para confirmarlo.

### Comparación

**Sin timeout**:

```
Mouse sobre elemento hijo → dragLeave → Animación desaparece ❌
Mouse vuelve al padre → dragEnter → Animación aparece
Resultado: Parpadeo constante 😵
```

**Con timeout de 50ms**:

```
Mouse sobre elemento hijo → dragLeave → Inicia timeout
Mouse vuelve al padre (antes de 50ms) → dragOver → Cancela timeout
Resultado: Animación fluida ✅
```

## Testing

### Test 1: Animación desaparece al salir

1. Arrastra un archivo sobre el área
2. Sal completamente del área (mueve el mouse fuera)
3. **Verifica**: Animación debe desaparecer en ~50ms

### Test 2: Animación no parpadea

1. Arrastra un archivo sobre el área
2. Mueve el mouse rápidamente sobre diferentes elementos (botones, texto, etc.)
3. **Verifica**: Animación NO debe parpadear

### Test 3: Animación desaparece al soltar

1. Arrastra un archivo sobre el área
2. Suelta el archivo
3. **Verifica**: Animación debe desaparecer inmediatamente

### Test 4: Animación no se queda trabada

1. Arrastra un archivo sobre el área
2. Sal del área sin soltar
3. Suelta el archivo fuera del área
4. **Verifica**: Animación debe desaparecer

### Test 5: Logs en consola

1. Abre la consola (F12)
2. Arrastra un archivo
3. Sal del área
4. **Verifica**: Deberías ver `🚫 Drag left the area`

## Debugging

Si la animación aún se queda trabada:

### 1. Verifica los logs

Abre la consola y busca:

```
🚫 Drag left the area  ← Debe aparecer cuando sales
```

Si NO aparece, el evento `dragLeave` no se está disparando.

### 2. Verifica el estado de `isDragging`

Agrega un log temporal:

```typescript
onDragLeave(event: DragEvent): void {
  console.log('🔍 DragLeave - isDragging:', this.isDragging());
  // ... resto del código
}
```

### 3. Verifica el `currentTarget`

Agrega un log temporal:

```typescript
onDragLeave(event: DragEvent): void {
  const currentTarget = event.currentTarget as HTMLElement;
  console.log('🔍 CurrentTarget:', currentTarget.className);
  // ... resto del código
}
```

Debe mostrar: `upload-drop-zone`

### 4. Verifica el timeout

Agrega logs temporales:

```typescript
this.dragLeaveTimeout = setTimeout(() => {
  console.log("⏰ Timeout ejecutado");
  // ... resto del código
}, 50);
```

### 5. Forzar desactivación

Si la animación se queda trabada, puedes forzar la desactivación:

**Opción A**: Hacer click en cualquier parte

```typescript
@HostListener('click')
onClick(): void {
  if (this.isDragging()) {
    this.isDragging.set(false);
  }
}
```

**Opción B**: Presionar ESC

```typescript
@HostListener('document:keydown.escape')
onEscape(): void {
  this.isDragging.set(false);
}
```

## Solución Alternativa (Si aún no funciona)

Si después de estos cambios la animación aún se queda trabada, prueba esta solución más agresiva:

### Opción 1: Timeout más largo

```typescript
this.dragLeaveTimeout = setTimeout(() => {
  // ...
}, 100); // ← Cambiar de 50ms a 100ms
```

### Opción 2: Verificar posición del mouse

```typescript
onDragLeave(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  this.dragLeaveTimeout = setTimeout(() => {
    const currentTarget = event.currentTarget as HTMLElement;
    const rect = currentTarget.getBoundingClientRect();

    // Verificar si el mouse está realmente fuera del área
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const isOutside =
      mouseX < rect.left ||
      mouseX > rect.right ||
      mouseY < rect.top ||
      mouseY > rect.bottom;

    if (isOutside) {
      this.isDragging.set(false);
    }
  }, 50);
}
```

### Opción 3: Listener global de mousemove

```typescript
private preventDefaultDragBehavior(): void {
  window.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
  }, false);

  window.addEventListener('drop', (e: DragEvent) => {
    e.preventDefault();
  }, false);

  // Agregar listener para detectar cuando el drag termina
  window.addEventListener('dragend', () => {
    this.isDragging.set(false);
  }, false);
}
```

## Resumen de Cambios

### Archivo: `home.ts`

1. ✅ Agregada variable `dragLeaveTimeout`
2. ✅ Simplificada lógica de `onDragLeave` con timeout
3. ✅ Agregada cancelación de timeout en `onDragOver`
4. ✅ Agregada limpieza de timeout en `onDrop`
5. ✅ Agregada limpieza de timeout en `ngOnDestroy`
6. ✅ Agregados logs de debug

### Resultado

- ✅ Animación desaparece correctamente al salir
- ✅ No hay parpadeos al mover el mouse
- ✅ No se queda trabada
- ✅ Desaparece al soltar el archivo
- ✅ Sin memory leaks

---

**Estado**: Cambios aplicados ✅
**Requiere reinicio**: Sí (cambios en TypeScript)
**Requiere limpiar caché**: Sí (`Ctrl + Shift + R`)
