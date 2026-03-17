# Guía Completa: Drag & Drop con Animaciones

## 📋 Descripción

Sistema completo de drag & drop con animaciones premium para subir archivos y carpetas. Incluye detección en todo el contorno, animaciones fluidas y soluciones a problemas comunes.

---

## ✨ Características

- ✅ Drag & drop funciona en todo el contorno del área
- ✅ 8 elementos animados (5 archivos + 3 carpetas cayendo)
- ✅ Borde animado con gradiente rotatorio
- ✅ Partículas flotantes distribuidas
- ✅ Icono con pulso y flotación
- ✅ Texto con efecto shimmer
- ✅ Botones completamente funcionales
- ✅ Compatible con dark mode
- ✅ Performance optimizado (GPU accelerated)

---

## 🎯 Problemas Resueltos

### Problema 1: Animaciones No Aparecen

**Causa**: `onDragLeave` se disparaba prematuramente al pasar sobre elementos hijos.

**Solución**: Lógica mejorada que verifica si realmente saliste del contenedor.

### Problema 2: Archivo Abre Nueva Pestaña

**Causa**: Comportamiento por defecto del navegador no estaba prevenido.

**Solución**: Listeners globales para prevenir el comportamiento por defecto.

### Problema 3: Drop Solo Funciona Abajo

**Causa**: `pointer-events` bloqueaba eventos en la parte superior.

**Solución**: Estrategia de capas con `pointer-events` inteligente.

### Problema 4: Animaciones Trabadas

**Causa**: Eventos de drag no se limpiaban correctamente.

**Solución**: Múltiples capas de protección (timeout, dragend, ESC, watchdog).

---

## 🔧 Implementación

### 1. TypeScript (home.ts)

```typescript
// Variables de estado
isDragging = signal(false);
private dragLeaveTimeout: any = null;
private dragWatchdogTimeout: any = null;

constructor() {
  this.initializeFolderWatcher();
  this.preventDefaultDragBehavior();
  this.setupKeyboardListeners();
}

// Prevenir comportamiento por defecto
private preventDefaultDragBehavior(): void {
  window.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
  }, false);

  window.addEventListener('drop', (e: DragEvent) => {
    e.preventDefault();
  }, false);

  // Detectar cuando el drag termina globalmente
  window.addEventListener('dragend', () => {
    this.isDragging.set(false);
    console.log('🔚 Drag ended globally');
  }, false);

  // Detectar cuando sale de la ventana
  window.addEventListener('dragleave', (e: DragEvent) => {
    if (!e.relatedTarget) {
      this.isDragging.set(false);
      console.log('🚪 Drag left window');
    }
  }, false);
}

// Listener de teclado para ESC
private setupKeyboardListeners(): void {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isDragging()) {
      this.isDragging.set(false);
      console.log('⌨️ Drag cancelled with ESC');
    }
  });
}

// Cuando el archivo entra al área
onDragEnter(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
    const hasValidFiles = this.fileDropService.checkDraggedFiles(event.dataTransfer);
    if (hasValidFiles) {
      this.isDragging.set(true);

      // Watchdog: desactivar después de 5 segundos
      this.dragWatchdogTimeout = setTimeout(() => {
        if (this.isDragging()) {
          this.isDragging.set(false);
          console.warn('⚠️ Drag watchdog: Forced deactivation after 5s');
        }
      }, 5000);
    }
  }
}

// Mientras se arrastra sobre el área
onDragOver(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  // Cancelar timeout de dragLeave
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

// Cuando sale del área
onDragLeave(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  // Limpiar timeout anterior
  if (this.dragLeaveTimeout) {
    clearTimeout(this.dragLeaveTimeout);
  }

  // Timeout de 10ms para evitar parpadeos
  this.dragLeaveTimeout = setTimeout(() => {
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      this.isDragging.set(false);
      console.log('🚫 Drag left the area');
    }
  }, 10);
}

// Cuando se suelta el archivo
async onDrop(event: DragEvent): Promise<void> {
  event.preventDefault();
  event.stopPropagation();

  // Limpiar timeouts
  if (this.dragLeaveTimeout) {
    clearTimeout(this.dragLeaveTimeout);
    this.dragLeaveTimeout = null;
  }
  if (this.dragWatchdogTimeout) {
    clearTimeout(this.dragWatchdogTimeout);
    this.dragWatchdogTimeout = null;
  }

  this.isDragging.set(false);
  console.log('🎯 Drop event captured!', event.dataTransfer);

  // Procesar archivos...
}

// Limpiar al destruir el componente
ngOnDestroy(): void {
  if (this.dragLeaveTimeout) {
    clearTimeout(this.dragLeaveTimeout);
  }
  if (this.dragWatchdogTimeout) {
    clearTimeout(this.dragWatchdogTimeout);
  }
  this.fileProcessingService.cleanup();
  this.folderWatcher.stopWatching();
}
```

### 2. HTML (home.html)

```html
<div class="upload-area-container">
  <!-- Zona de drop absoluta -->
  <div
    class="upload-drop-zone"
    [ngClass]="{ dragging: isDragging() }"
    (dragenter)="onDragEnter($event)"
    (dragover)="onDragOver($event)"
    (dragleave)="onDragLeave($event)"
    (drop)="onDrop($event)"
  >
    <!-- Animaciones (8 elementos) -->
    @if (isDragging()) {
    <div class="file-drop-preview"></div>
    <div class="file-drop-preview"></div>
    <div class="file-drop-preview"></div>
    <div class="file-drop-preview"></div>
    <div class="file-drop-preview"></div>
    <div class="folder-drop-preview"></div>
    <div class="folder-drop-preview"></div>
    <div class="folder-drop-preview"></div>
    }
  </div>

  <!-- Contenido por encima -->
  <div class="upload-content">
    <!-- Tu contenido aquí -->
  </div>
</div>
```

### 3. CSS (home.css)

Ver archivo completo en `GUIAS/GUIA-ARREGLAR-DRAG-DROP.md` para todos los estilos.

**Puntos clave**:

```css
/* Contenedor */
.upload-area-container {
  position: relative;
  min-height: 400px;
}

/* Zona de drop */
.upload-drop-zone {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  z-index: 1;
}

/* Contenido */
.upload-content {
  position: relative;
  z-index: 10;
  pointer-events: none;
}

/* Elementos interactivos */
.upload-content button,
.upload-content input,
.upload-content app-button {
  pointer-events: auto;
}
```

---

## 🧪 Testing

### Test 1: Animaciones Aparecen

1. Arrastra un archivo sobre el área
2. **Resultado esperado**: 5 archivos y 3 carpetas cayendo

### Test 2: Drop en Todo el Contorno

1. Arrastra un archivo
2. Suéltalo en diferentes posiciones (esquinas, centro, sobre botones)
3. **Resultado esperado**: Funciona en todas las posiciones

### Test 3: Animaciones No Parpadean

1. Arrastra un archivo
2. Mueve el mouse rápidamente sobre diferentes elementos
3. **Resultado esperado**: Animaciones se mantienen visibles

### Test 4: Animaciones Desaparecen al Salir

1. Arrastra un archivo sobre el área
2. Sal completamente del área
3. **Resultado esperado**: Animaciones desaparecen en ~10ms

### Test 5: Archivo No Abre Nueva Pestaña

1. Arrastra un archivo PDF
2. Suéltalo en el área
3. **Resultado esperado**: Se agrega a la lista, NO abre nueva pestaña

### Test 6: Botones Funcionan

1. Click en "Browse Files"
2. Click en "Start"
3. Click en "Clear all"
4. **Resultado esperado**: Todos los botones funcionan

---

## 🐛 Debugging

### Si las animaciones no aparecen:

```typescript
// Agregar logs temporales
onDragEnter(event: DragEvent): void {
  console.log('🎯 DragEnter!', this.isDragging());
  // ... resto del código
}
```

### Si el drop no funciona:

```typescript
onDrop(event: DragEvent): Promise<void> {
  console.log('🎯 Drop en:', event.target);
  console.log('📍 Posición:', event.clientX, event.clientY);
  // ... resto del código
}
```

### Verificar CSS en DevTools:

```css
.upload-drop-zone {
  pointer-events: auto; /* Debe ser 'auto' */
  z-index: 1;
}

.upload-content {
  pointer-events: none; /* Debe ser 'none' */
  z-index: 10;
}
```

---

## 📊 Capas de Protección

| Método             | Cuándo se Activa    | Tiempo |
| ------------------ | ------------------- | ------ |
| `onDragLeave`      | Sales del área      | 10ms   |
| `window dragend`   | Sueltas el archivo  | 0ms    |
| `window dragleave` | Sales de la ventana | 0ms    |
| `ESC key`          | Presionas ESC       | 0ms    |
| `Watchdog`         | Después de 5s       | 5000ms |

---

## ✅ Checklist

- [x] Agregado `onDragEnter()`
- [x] Mejorado `onDragLeave()` con timeout
- [x] Agregado `preventDefaultDragBehavior()`
- [x] Agregado `setupKeyboardListeners()`
- [x] Agregado watchdog timer
- [x] Cambiado `pointer-events` en CSS
- [x] Agregado evento `dragenter` en HTML
- [x] Limpieza en `ngOnDestroy()`

---

## 🎯 Resultado Final

- ✅ Animaciones en todo el contorno
- ✅ Drop funciona en cualquier posición
- ✅ Archivos NO abren nueva pestaña
- ✅ Animaciones NO se traban
- ✅ Botones completamente funcionales
- ✅ Performance optimizado

---

**Fecha**: Marzo 2026  
**Versión**: 1.0.0
