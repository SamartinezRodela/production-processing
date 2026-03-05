# Guía para Arreglar el Drag and Drop - Animación en Todo el Contorno

## Problema Actual

Las animaciones de drag and drop (archivos y carpetas cayendo) solo se muestran en el centro del área de upload. Necesitamos que:

1. La animación se active en todo el contorno del área
2. Los archivos puedan soltarse en cualquier parte del área
3. Las animaciones de archivos/carpetas cayendo se distribuyan por todo el espacio

## Solución

### 1. Modificar el HTML (home.html)

Actualiza la sección del upload-area para que el área de drop cubra todo el espacio:

```html
<!-- Upload Area con área de drop expandida -->
<div
  class="upload-area-container bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12"
>
  <!-- Área de drop que cubre todo el contenedor -->
  <div
    class="upload-drop-zone"
    [ngClass]="{
      'dragging': isDragging()
    }"
    (dragover)="onDragOver($event)"
    (dragleave)="onDragLeave($event)"
    (drop)="onDrop($event)"
  >
    <!-- Animaciones de archivos y carpetas cayendo -->
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

  <!-- Contenido del upload area -->
  <div class="upload-content">
    @if (selectedFiles().length > 0) {
    <!-- Lista de archivos -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ selectedFiles().length }} file(s) ready to process
        </span>
      </div>
      <button
        type="button"
        (click)="clearAllFiles(); $event.stopPropagation()"
        class="text-xs font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        Clear all
      </button>
    </div>

    <div class="space-y-2 max-h-64 overflow-y-auto pr-2 file-list mb-6">
      @for (file of selectedFiles(); track file.name; let i = $index) {
      <div
        class="file-item group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
      >
        <!-- Contenido del archivo (mantener igual) -->
      </div>
      }
    </div>

    <!-- Botones cuando hay archivos -->
    <div
      class="flex items-center justify-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <input
        type="file"
        id="fileInput"
        multiple
        (change)="onFileSelect($event)"
        class="hidden"
      />
      <app-button
        [label]="'Browse Files'"
        [variant]="'white'"
        [size]="'md'"
        [icon]="'folder'"
        [iconPosition]="'left'"
        [iconSize]="16"
        (clicked)="triggerFileInput()"
      />
      <app-button
        [label]="isProcessing() ? 'Processing...' : 'Start'"
        [variant]="'primary'"
        [size]="'md'"
        (clicked)="uploadFiles()"
        [disabled]="(!loadedFromFolder() && selectedFiles().length === 0) || isProcessing()"
      />
    </div>
    } @else {
    <!-- Mensaje de drag & drop cuando NO hay archivos -->
    <div class="upload-placeholder">
      <div class="upload-icon-container">
        <app-icon
          [name]="'cloud-upload'"
          [size]="80"
          class="mx-auto mb-4 text-gray-400 dark:text-gray-500"
        />
      </div>

      <h2 class="text-base font-normal text-gray-700 dark:text-gray-300 mb-6">
        @if (isDragging()) {
        <span class="text-blue-600 dark:text-blue-400 font-medium"
          >Drop files or folders here</span
        >
        } @else {
        <span>Drag & Drop Files or Folders Here</span>
        }
      </h2>

      <input
        type="file"
        id="fileInput"
        multiple
        (change)="onFileSelect($event)"
        class="hidden"
      />

      <!-- Botones cuando NO hay archivos -->
      <div class="flex items-center justify-center gap-3">
        <app-button
          [label]="'Browse Files'"
          [variant]="'white'"
          [size]="'md'"
          [icon]="'folder'"
          [iconPosition]="'left'"
          [iconSize]="16"
          (clicked)="triggerFileInput()"
        />
        <app-button
          [label]="isProcessing() ? 'Processing...' : 'Start'"
          [variant]="'primary'"
          [size]="'md'"
          (clicked)="uploadFiles()"
          [disabled]="(!loadedFromFolder() && selectedFiles().length === 0) || isProcessing()"
        />
      </div>
    </div>
    }
  </div>
</div>
```

### 2. Actualizar el CSS (home.css)

Reemplaza las secciones relevantes con estos estilos mejorados:

```css
/* Contenedor principal del upload area */
.upload-area-container {
  position: relative;
  min-height: 400px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Zona de drop que cubre todo el contenedor */
.upload-drop-zone {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  pointer-events: none;
  z-index: 1;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Contenido del upload (por encima de la zona de drop) */
.upload-content {
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

/* Efecto cuando se arrastra sobre el área */
.upload-drop-zone.dragging {
  pointer-events: auto;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(147, 197, 253, 0.05) 50%,
    rgba(59, 130, 246, 0.08) 100%
  );
  backdrop-filter: blur(10px);
  box-shadow:
    0 0 0 2px rgba(59, 130, 246, 0.3) inset,
    0 20px 40px -10px rgba(59, 130, 246, 0.2),
    0 0 60px -15px rgba(59, 130, 246, 0.3);
}

/* Borde animado cuando se arrastra */
.upload-drop-zone.dragging::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: 8px;
  padding: 2px;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.6),
    rgba(147, 197, 253, 0.6),
    rgba(59, 130, 246, 0.6)
  );
  background-size: 200% 200%;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: gradient-rotate 3s linear infinite;
}

/* Efecto de partículas flotantes en todo el área */
.upload-drop-zone.dragging::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(
      circle at 10% 20%,
      rgba(59, 130, 246, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 90% 30%,
      rgba(147, 197, 253, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 30% 80%,
      rgba(59, 130, 246, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 70% 70%,
      rgba(147, 197, 253, 0.12) 0%,
      transparent 50%
    );
  animation: particles-float 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes gradient-rotate {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes particles-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  33% {
    transform: translate(10px, -10px) scale(1.1);
    opacity: 0.8;
  }
  66% {
    transform: translate(-10px, 10px) scale(0.9);
    opacity: 0.7;
  }
}

/* Animación de archivos cayendo - distribuidos por todo el área */
.file-drop-preview {
  position: absolute;
  width: 24px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 4px;
  box-shadow:
    0 10px 30px rgba(59, 130, 246, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  pointer-events: none;
  opacity: 0;
  z-index: 5;
}

.upload-drop-zone.dragging .file-drop-preview {
  animation: file-drop 2s ease-in-out infinite;
}

/* Distribuir archivos en diferentes posiciones horizontales */
.upload-drop-zone.dragging .file-drop-preview:nth-child(1) {
  left: 10%;
  animation-delay: 0s;
}

.upload-drop-zone.dragging .file-drop-preview:nth-child(2) {
  left: 25%;
  animation-delay: 0.3s;
}

.upload-drop-zone.dragging .file-drop-preview:nth-child(3) {
  left: 45%;
  animation-delay: 0.6s;
}

.upload-drop-zone.dragging .file-drop-preview:nth-child(4) {
  left: 65%;
  animation-delay: 0.9s;
}

.upload-drop-zone.dragging .file-drop-preview:nth-child(5) {
  left: 85%;
  animation-delay: 1.2s;
}

@keyframes file-drop {
  0% {
    top: -60px;
    opacity: 0;
    transform: translateY(0) rotate(-5deg) scale(0.8);
  }
  10% {
    opacity: 1;
  }
  50% {
    top: 40%;
    transform: translateY(-50%) rotate(0deg) scale(1);
    opacity: 1;
  }
  70% {
    opacity: 0.8;
  }
  100% {
    top: calc(100% + 60px);
    opacity: 0;
    transform: translateY(0) rotate(5deg) scale(0.9);
  }
}

/* Icono de documento dentro del archivo */
.file-drop-preview::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Líneas del documento */
.file-drop-preview::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -40%);
  width: 10px;
  height: 2px;
  background: linear-gradient(
    to bottom,
    #3b82f6 0%,
    #3b82f6 20%,
    transparent 20%,
    transparent 40%,
    #3b82f6 40%,
    #3b82f6 60%,
    transparent 60%,
    transparent 80%,
    #3b82f6 80%,
    #3b82f6 100%
  );
  background-size: 100% 10px;
}

/* Efecto de carpeta cayendo */
.folder-drop-preview {
  position: absolute;
  width: 50px;
  height: 40px;
  pointer-events: none;
  opacity: 0;
  z-index: 5;
}

.upload-drop-zone.dragging .folder-drop-preview {
  animation: folder-drop 1.8s ease-in-out infinite;
}

.upload-drop-zone.dragging .folder-drop-preview:nth-child(6) {
  left: 20%;
  animation-delay: 0.4s;
}

.upload-drop-zone.dragging .folder-drop-preview:nth-child(7) {
  left: 50%;
  animation-delay: 0.8s;
}

.upload-drop-zone.dragging .folder-drop-preview:nth-child(8) {
  left: 75%;
  animation-delay: 1.2s;
}

@keyframes folder-drop {
  0% {
    top: -60px;
    opacity: 0;
    transform: translateY(0) rotate(-8deg) scale(0.7);
  }
  10% {
    opacity: 1;
  }
  50% {
    top: 40%;
    transform: translateY(-50%) rotate(0deg) scale(1.05);
    opacity: 1;
  }
  70% {
    opacity: 0.8;
  }
  100% {
    top: calc(100% + 60px);
    opacity: 0;
    transform: translateY(0) rotate(8deg) scale(0.85);
  }
}

/* Forma de carpeta */
.folder-drop-preview::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
  border-radius: 4px;
  box-shadow:
    0 10px 30px rgba(96, 165, 250, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

/* Pestaña de carpeta */
.folder-drop-preview::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 25px;
  height: 14px;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 4px 4px 0 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

/* Animación del icono de upload */
.upload-icon-container {
  position: relative;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.upload-drop-zone.dragging ~ .upload-content .upload-icon-container {
  transform: translateY(-12px) scale(1.15);
}

.upload-icon-container::before {
  content: "";
  position: absolute;
  inset: -20px;
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.2) 0%,
    transparent 70%
  );
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.upload-drop-zone.dragging ~ .upload-content .upload-icon-container::before {
  opacity: 1;
  animation: icon-pulse 2s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
}

.upload-icon-container svg {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.upload-drop-zone.dragging ~ .upload-content .upload-icon-container svg {
  filter: drop-shadow(0 8px 16px rgba(59, 130, 246, 0.4))
    drop-shadow(0 0 20px rgba(59, 130, 246, 0.3));
  animation: icon-float 3s ease-in-out infinite;
}

@keyframes icon-float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-8px) rotate(-2deg);
  }
  50% {
    transform: translateY(-12px) rotate(0deg);
  }
  75% {
    transform: translateY(-8px) rotate(2deg);
  }
}

/* Texto con efecto de brillo */
.upload-placeholder h2 {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.upload-drop-zone.dragging ~ .upload-content .upload-placeholder h2 {
  transform: translateY(-4px);
  letter-spacing: 0.02em;
}

.upload-drop-zone.dragging ~ .upload-content .upload-placeholder h2 span {
  background: linear-gradient(
    135deg,
    #3b82f6 0%,
    #60a5fa 25%,
    #93c5fd 50%,
    #60a5fa 75%,
    #3b82f6 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: text-shimmer 3s linear infinite;
  font-weight: 600;
  filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.3));
}

@keyframes text-shimmer {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}
```

### 3. Características de la Solución

✅ **Área de drop completa**: El drag and drop funciona en todo el contorno del área
✅ **Animaciones distribuidas**: Los archivos y carpetas caen en diferentes posiciones
✅ **Más elementos animados**: 5 archivos + 3 carpetas cayendo simultáneamente
✅ **Efecto de borde animado**: Borde con gradiente que rota cuando arrastras
✅ **Partículas flotantes**: Efecto de partículas distribuidas por todo el área
✅ **Interactividad preservada**: Los botones y elementos siguen siendo clickeables
✅ **Responsive**: Se adapta al tamaño del contenedor

### 4. Personalización Adicional

Si quieres ajustar la animación, puedes modificar:

**Velocidad de caída:**

```css
.upload-drop-zone.dragging .file-drop-preview {
  animation: file-drop 1.5s ease-in-out infinite; /* Más rápido */
}
```

**Más archivos cayendo:**
Agrega más elementos en el HTML:

```html
<div class="file-drop-preview"></div>
<div class="file-drop-preview"></div>
<!-- Agrega más según necesites -->
```

Y en el CSS:

```css
.upload-drop-zone.dragging .file-drop-preview:nth-child(6) {
  left: 95%;
  animation-delay: 1.5s;
}
```

**Cambiar colores:**

```css
.file-drop-preview {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%); /* Verde */
}
```

### 5. Notas Importantes

- La zona de drop (`upload-drop-zone`) está en `position: absolute` y cubre todo el contenedor
- El contenido (`upload-content`) está en `position: relative` con `z-index: 10` para estar por encima
- Los elementos animados tienen `pointer-events: none` para no bloquear clicks
- El contenido tiene `pointer-events: auto` para mantener la interactividad

### 6. Testing

Para probar que funciona correctamente:

1. Arrastra archivos desde cualquier esquina del área
2. Verifica que las animaciones se muestren en todo el espacio
3. Confirma que los botones sigan siendo clickeables
4. Prueba con archivos y carpetas
5. Verifica que funcione con y sin archivos ya cargados
