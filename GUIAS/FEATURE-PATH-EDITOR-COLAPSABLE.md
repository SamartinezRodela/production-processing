# Feature: Path Editor Colapsable en Home

## Estado: ✅ IMPLEMENTADO

## Descripción

Sección colapsable ultra-minimalista en la página Home para editar rápidamente Base Path y Output Path sin necesidad de navegar a Settings.

---

## Características Principales

### 1. **Diseño Colapsable**

- Por defecto: Colapsado (solo muestra header)
- Auto-expandido: Si los paths son defaults
- Toggle manual: Click en el header para expandir/colapsar
- Animación suave: Transición de 300ms con slideDown

### 2. **Header Inteligente**

```
┌────────────────────────────────────────────────────┐
│ 📁 Quick Path Configuration  [Configure ⚠️]  [▼]  │
└────────────────────────────────────────────────────┘
```

**Elementos del header:**

- Icono de carpeta
- Título "Quick Path Configuration"
- Badge "Configure" (solo si paths son defaults)
- Icono chevron (up/down según estado)
- Hover effect: Fondo gris claro

### 3. **Contenido Expandido**

```
┌────────────────────────────────────────────────────┐
│ 📁 Quick Path Configuration  [Configure ⚠️]  [▲]  │
├────────────────────────────────────────────────────┤
│ 📁 [C:\Production\Files........] [📂]  │  📁 [C:\Production\Output.....] [📂] │
└────────────────────────────────────────────────────┘
```

**Elementos del contenido:**

- Dos inputs lado a lado (Base Path | Output Path)
- Iconos pequeños (14px) con tooltips
- Botones Browse compactos
- Divider vertical entre paths
- Inputs con texto pequeño (text-xs)

### 4. **Comportamiento Inteligente**

#### Auto-expansión:

- ✅ Se expande automáticamente si los paths son defaults
- ✅ Muestra badge "Configure" en el header
- ✅ Ayuda al usuario a configurar paths en primer uso

#### Validación:

- ✅ Validación en blur (copy-paste)
- ✅ Validación en Browse
- ✅ Auto-guardado después de validación exitosa
- ✅ Notificaciones de éxito/error

#### Persistencia:

- ✅ El estado (expandido/colapsado) se mantiene durante la sesión
- ✅ Los cambios se guardan automáticamente en backend
- ✅ Warning banner se actualiza al cambiar paths

---

## Implementación Técnica

### TypeScript (home.ts)

**Signal agregado:**

```typescript
isPathEditorExpanded = signal(false);
```

**Método toggle:**

```typescript
togglePathEditor(): void {
  this.isPathEditorExpanded.set(!this.isPathEditorExpanded());
}
```

**Auto-expansión en checkPathConfiguration:**

```typescript
if (
  (isDefaultBasePath || isDefaultOutputPath) &&
  !this.pathWarningDismissed()
) {
  this.showPathWarning.set(true);
  this.isPathEditorExpanded.set(true); // Auto-expandir
}
```

### HTML (home.html)

**Estructura:**

```html
<div class="...rounded-lg mb-4 overflow-hidden transition-all">
  <!-- Header colapsable -->
  <button (click)="togglePathEditor()" class="w-full px-4 py-2.5...">
    <div class="flex items-center gap-2">
      <app-icon name="folder" />
      <span>Quick Path Configuration</span>
      @if (showPathWarning()) {
      <app-badge label="Configure" variant="warning" />
      }
    </div>
    <app-icon [name]="isPathEditorExpanded() ? 'chevron-up' : 'chevron-down'" />
  </button>

  <!-- Contenido colapsable -->
  @if (isPathEditorExpanded()) {
  <div class="...animate-slideDown">
    <!-- Base Path y Output Path -->
  </div>
  }
</div>
```

### CSS (home.css)

**Animación slideDown:**

```css
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 200px;
    transform: translateY(0);
  }
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out forwards;
}
```

---

## Estados Visuales

### Estado 1: Colapsado (Paths configurados)

```
┌────────────────────────────────────────┐
│ 📁 Quick Path Configuration       [▼] │
└────────────────────────────────────────┘
```

- Altura mínima
- Sin badge de warning
- Chevron apuntando hacia abajo

### Estado 2: Colapsado (Paths defaults)

```
┌──────────────────────────────────────────────┐
│ 📁 Quick Path Configuration [Configure ⚠️] [▼] │
└──────────────────────────────────────────────┘
```

- Badge amarillo "Configure"
- Indica que necesita configuración

### Estado 3: Expandido

```
┌──────────────────────────────────────────────┐
│ 📁 Quick Path Configuration [Configure ⚠️] [▲] │
├──────────────────────────────────────────────┤
│ 📁 [Base path...........] [📂]  │  📁 [Output path........] [📂] │
└──────────────────────────────────────────────┘
```

- Muestra inputs editables
- Botones Browse visibles
- Chevron apuntando hacia arriba
- Animación suave al expandir

---

## Flujos de Usuario

### Flujo 1: Primera vez (Paths defaults)

1. Usuario abre la aplicación
2. Warning banner aparece arriba
3. Path Editor se expande automáticamente
4. Badge "Configure" visible en header
5. Usuario configura paths
6. Al guardar: Warning desaparece, badge desaparece

### Flujo 2: Edición rápida

1. Usuario hace click en header
2. Sección se expande con animación
3. Usuario edita path (copy-paste o Browse)
4. Al blur: Validación automática
5. Si válido: Auto-guardado + notificación
6. Usuario puede colapsar haciendo click en header

### Flujo 3: Paths ya configurados

1. Sección aparece colapsada
2. Sin badge de warning
3. Usuario puede expandir si necesita cambiar paths
4. Interfaz limpia y minimalista

---

## Ventajas del Diseño Colapsable

### UX:

- ✅ **Minimalista**: No ocupa espacio cuando no se necesita
- ✅ **Inteligente**: Se expande automáticamente cuando es necesario
- ✅ **Accesible**: Siempre disponible con un click
- ✅ **Visual**: Badge indica cuando necesita atención
- ✅ **Fluido**: Animaciones suaves y naturales

### Performance:

- ✅ **Ligero**: Solo renderiza contenido cuando está expandido
- ✅ **Eficiente**: No afecta el rendimiento de la página
- ✅ **Responsive**: Se adapta al tamaño de la ventana

### Mantenibilidad:

- ✅ **Simple**: Lógica clara con signals
- ✅ **Reutilizable**: Patrón aplicable a otras secciones
- ✅ **Testeable**: Comportamiento predecible

---

## Comparación con Versiones Anteriores

### Versión 1: Siempre visible

- ❌ Ocupaba mucho espacio
- ❌ Distraía del contenido principal
- ✅ Acceso inmediato

### Versión 2: Ultra minimalista

- ✅ Compacta
- ❌ Siempre visible
- ❌ Sin indicador de estado

### Versión 3: Colapsable (ACTUAL)

- ✅ Minimalista cuando no se necesita
- ✅ Visible cuando es importante
- ✅ Indicador de estado (badge)
- ✅ Acceso rápido con un click
- ✅ Auto-expansión inteligente

---

## Testing

### Casos de prueba:

- ✅ Expandir/colapsar manualmente
- ✅ Auto-expansión con paths defaults
- ✅ Badge aparece/desaparece correctamente
- ✅ Validación funciona en estado expandido
- ✅ Auto-guardado después de validación
- ✅ Animación suave sin glitches
- ✅ Responsive en diferentes tamaños de ventana

---

## Archivos Modificados

### Frontend:

- `nest-ui-fe/src/app/pages/home/home.ts` - Lógica de toggle y auto-expansión
- `nest-ui-fe/src/app/pages/home/home.html` - UI colapsable
- `nest-ui-fe/src/app/pages/home/home.css` - Animación slideDown

---

## Mejoras Futuras (Opcionales)

### Posibles mejoras:

1. **Recordar estado**: Guardar en localStorage si el usuario prefiere expandido/colapsado
2. **Keyboard shortcuts**: Ctrl+P para toggle
3. **Drag & Drop**: Arrastrar carpetas directamente al header
4. **Validación en tiempo real**: Mientras el usuario escribe
5. **Sugerencias**: Mostrar paths recientes o favoritos

---

## Conclusión

La versión colapsable ofrece el mejor balance entre:

- **Minimalismo**: No ocupa espacio innecesario
- **Funcionalidad**: Acceso rápido cuando se necesita
- **UX**: Comportamiento inteligente y predecible
- **Estética**: Diseño limpio y profesional

Es la solución ideal para un editor de paths que debe estar disponible pero no ser intrusivo.
