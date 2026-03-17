# Guía: Refactorizar PDF Metadata Analysis a Componente Separado

## 📋 Objetivo

Extraer la sección "PDF Metadata Analysis" del componente `home` a un componente independiente y reutilizable llamado `pdf-metadata-table`.

---

## 🎯 Beneficios

### Antes (Situación Actual)

- ❌ Componente `home` muy grande (1500+ líneas HTML, 1200+ líneas TS)
- ❌ Difícil de mantener y testear
- ❌ Lógica mezclada (upload, processing, metadata, errors)
- ❌ No reutilizable

### Después (Con Componente Separado)

- ✅ Componente `home` más pequeño y enfocado
- ✅ Componente `pdf-metadata-table` independiente y reutilizable
- ✅ Más fácil de mantener y testear
- ✅ Mejor organización del código
- ✅ Change detection más eficiente

---

## 📁 Estructura del Nuevo Componente

```
nest-ui-fe/src/app/components/
└── pdf-metadata-table/
    ├── pdf-metadata-table.ts       # Lógica del componente
    ├── pdf-metadata-table.html     # Template
    └── pdf-metadata-table.css      # Estilos (opcional)
```

---

## 🔧 Paso 1: Crear el Componente

### 1.1 Crear la carpeta y archivos

```bash
# Desde nest-ui-fe/src/app/components/
mkdir pdf-metadata-table
cd pdf-metadata-table
touch pdf-metadata-table.ts
touch pdf-metadata-table.html
touch pdf-metadata-table.css
```

---

## 📝 Paso 2: Definir el Componente TypeScript

### 2.1 Crear `pdf-metadata-table.ts`

```typescript
import { Component, input, output, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Button } from "@shared/button/button";
import { Icon } from "@shared/icon/icon";
import { Badge } from "@shared/badge/badge";
import { Input } from "@shared/input/input";
import { PDFContainer } from "@models/pdf-metadata.types";
import { FileUtilsService } from "@services/home/file-utils.service";
import { inject } from "@angular/core";

@Component({
  selector: "app-pdf-metadata-table",
  standalone: true,
  imports: [CommonModule, Button, Icon, Badge, Input, FormsModule],
  templateUrl: "./pdf-metadata-table.html",
  styleUrl: "./pdf-metadata-table.css",
})
export class PdfMetadataTable {
  // Services
  fileUtils = inject(FileUtilsService);

  // Inputs (datos que recibe del componente padre)
  pdfContainer = input.required<PDFContainer>();
  maxFileSize = input<number>(5 * 1024 * 1024 * 1024); // 5 GB por defecto

  // Outputs (eventos que emite al componente padre)
  exportMetadata = output<void>();
  clearMetadata = output<void>();
  openFileLocation = output<any>();

  // State interno del componente
  currentPage = signal(1);
  itemsPerPage = signal(10);
  filterStatus = signal<"all" | "valid" | "invalid">("all");
  filterInputRoot = signal<string>("");

  // Exponer Math para el template
  Math = Math;

  // Computed properties
  filteredFiles = computed(() => {
    let files = this.pdfContainer().files;

    // Filtrar por status
    if (this.filterStatus() === "valid") {
      files = files.filter((f) => f.Valid);
    } else if (this.filterStatus() === "invalid") {
      files = files.filter((f) => !f.Valid);
    }

    // Filtrar por InputRoot
    if (this.filterInputRoot().trim()) {
      const searchTerm = this.filterInputRoot().toLowerCase();
      files = files.filter((f) =>
        f.InputRoot.toLowerCase().includes(searchTerm),
      );
    }

    return files;
  });

  paginatedFiles = computed(() => {
    const files = this.filteredFiles();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return files.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredFiles().length / this.itemsPerPage());
  });

  totalFilteredFiles = computed(() => {
    return this.filteredFiles().length;
  });

  uniqueInputRoots = computed(() => {
    const roots = this.pdfContainer().files.map((f) => f.InputRoot);
    return [...new Set(roots)].sort();
  });

  // Cálculos de tamaño y límite
  totalValidFilesSize = computed(() => {
    const validFiles = this.pdfContainer().files.filter((f) => f.Valid);
    return validFiles.reduce((total, file) => total + file.FileSize, 0);
  });

  formattedTotalValidFilesSize = computed(() => {
    return this.fileUtils.formatFileSize(this.totalValidFilesSize());
  });

  formattedMaxFileSize = computed(() => {
    return this.fileUtils.formatFileSize(this.maxFileSize());
  });

  remainingSpace = computed(() => {
    return Math.max(0, this.maxFileSize() - this.totalValidFilesSize());
  });

  formattedRemainingSpace = computed(() => {
    return this.fileUtils.formatFileSize(this.remainingSpace());
  });

  usagePercentage = computed(() => {
    if (this.maxFileSize() === 0) return 0;
    return Math.min(
      100,
      (this.totalValidFilesSize() / this.maxFileSize()) * 100,
    );
  });

  isOverLimit = computed(() => {
    return this.totalValidFilesSize() > this.maxFileSize();
  });

  // Métodos de paginación
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  changeItemsPerPage(items: number): void {
    this.itemsPerPage.set(items);
    this.currentPage.set(1);
  }

  // Métodos de filtrado
  changeStatusFilter(status: "all" | "valid" | "invalid"): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
  }

  changeInputRootFilter(inputRoot: string): void {
    this.filterInputRoot.set(inputRoot);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.filterStatus.set("all");
    this.filterInputRoot.set("");
    this.currentPage.set(1);
  }

  // Métodos que emiten eventos al padre
  onExportMetadata(): void {
    this.exportMetadata.emit();
  }

  onClearMetadata(): void {
    this.clearMetadata.emit();
  }

  onOpenFileLocation(file: any): void {
    this.openFileLocation.emit(file);
  }
}
```

---

## 🎨 Paso 3: Crear el Template HTML

### 3.1 Copiar el HTML de `home.html`

Busca en `home.html` la sección que comienza con:

```html
<!-- PDF Metadata Container -->
<div class="bg-white dark:bg-gray-800 border..."></div>
```

Y termina antes de:

```html
<!-- PDF Generation Modal -->
```

### 3.2 Crear `pdf-metadata-table.html`

Copia toda esa sección y pégala en el nuevo archivo. Luego ajusta:

**Cambios necesarios:**

- Reemplazar `pdfContainer()` por `pdfContainer()`
- Reemplazar `exportMetadata()` por `onExportMetadata()`
- Reemplazar `clearMetadata()` por `onClearMetadata()`
- Reemplazar `openFileLocation(file)` por `onOpenFileLocation(file)`

---

## 🔄 Paso 4: Integrar en el Componente Home

### 4.1 Importar el nuevo componente en `home.ts`

```typescript
import { PdfMetadataTable } from "@components/pdf-metadata-table/pdf-metadata-table";

@Component({
  selector: "app-home",
  imports: [
    CommonModule,
    Button,
    Icon,
    Select,
    Badge,
    Input,
    FormsModule,
    PdfMetadataTable, // ← Agregar aquí
  ],
  templateUrl: "./home.html",
  styleUrl: "./home.css",
})
export class Home implements OnDestroy {
  // ... resto del código
}
```

### 4.2 Reemplazar el HTML en `home.html`

**Antes:**

```html
<!-- PDF Metadata Container -->
<div class="bg-white dark:bg-gray-800 border...">
  <!-- Todo el código de metadata analysis -->
</div>
```

**Después:**

```html
<!-- PDF Metadata Container -->
<app-pdf-metadata-table
  [pdfContainer]="pdfContainer()"
  [maxFileSize]="maxFileSize"
  (exportMetadata)="exportMetadata()"
  (clearMetadata)="clearMetadata()"
  (openFileLocation)="openFileLocation($event)"
/>
```

### 4.3 Limpiar código innecesario en `home.ts`

Puedes eliminar de `home.ts`:

- Variables de paginación (`currentPage`, `itemsPerPage`)
- Variables de filtros (`filterStatus`, `filterInputRoot`)
- Métodos de paginación (`goToPage`, `nextPage`, `previousPage`, etc.)
- Métodos de filtrado (`changeStatusFilter`, `changeInputRootFilter`, etc.)
- Getters de archivos filtrados (`filteredFiles`, `paginatedFiles`, etc.)

**MANTENER en `home.ts`:**

- Métodos `exportMetadata()`, `clearMetadata()`, `openFileLocation()`
- Getters de tamaño y límite (o pasarlos como inputs)

---

## 📦 Paso 5: Configurar Path Aliases (Opcional pero Recomendado)

### 5.1 Actualizar `tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/app/*"],
      "@components/*": ["src/app/components/*"],
      "@shared/*": ["src/app/components/shared/*"],
      "@services/*": ["src/app/service/*"],
      "@models/*": ["src/app/models/*"],
      "@environments/*": ["src/environments/*"]
    }
  }
}
```

---

## ✅ Paso 6: Verificar y Testear

### 6.1 Verificar que no hay errores

```bash
# Desde nest-ui-fe/
npm run build
# o
ng serve
```

### 6.2 Checklist de verificación

- [ ] El componente se renderiza correctamente
- [ ] Los filtros funcionan (All, Valid, Invalid)
- [ ] La paginación funciona
- [ ] El botón "Export JSON" funciona
- [ ] El botón "Clear All" funciona
- [ ] El botón "Open Location" funciona
- [ ] El indicador de límite se muestra correctamente
- [ ] Los estilos se aplican correctamente (light/dark mode)

---

## 🎨 Paso 7: Estilos (Opcional)

### 7.1 Si necesitas estilos específicos

Crea `pdf-metadata-table.css`:

```css
/* Estilos específicos del componente si son necesarios */
:host {
  display: block;
}

/* Animaciones personalizadas */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 📊 Comparación: Antes vs Después

### Antes

```
home.ts (1200 líneas)
├── Upload logic
├── Processing logic
├── Metadata analysis logic ← Mezclado
├── Error handling
├── PDF generation
└── Navigation

home.html (1500 líneas)
├── Upload area
├── Progress bars
├── Metadata table ← Mezclado
├── Error log
└── Modals
```

### Después

```
home.ts (800 líneas)
├── Upload logic
├── Processing logic
├── Error handling
├── PDF generation
└── Navigation

pdf-metadata-table.ts (400 líneas)
├── Filtros
├── Paginación
├── Cálculos de tamaño
└── Eventos

home.html (1000 líneas)
├── Upload area
├── Progress bars
├── <app-pdf-metadata-table /> ← Componente
├── Error log
└── Modals

pdf-metadata-table.html (500 líneas)
└── Tabla completa de metadata
```

---

## 🚀 Mejoras Futuras (Opcional)

### 1. Agregar más configurabilidad

```typescript
// En pdf-metadata-table.ts
showLimitIndicator = input<boolean>(true);
showFilters = input<boolean>(true);
showPagination = input<boolean>(true);
customColumns = input<string[]>(["FileName", "Style", "Size", "Valid"]);
```

### 2. Agregar eventos adicionales

```typescript
// Eventos útiles
rowClicked = output<any>();
filterChanged = output<{ status: string; inputRoot: string }>();
pageChanged = output<number>();
```

### 3. Agregar tests unitarios

```typescript
// pdf-metadata-table.spec.ts
describe("PdfMetadataTable", () => {
  it("should filter files by status", () => {
    // Test logic
  });

  it("should paginate correctly", () => {
    // Test logic
  });

  it("should calculate usage percentage", () => {
    // Test logic
  });
});
```

---

## 📝 Notas Importantes

### ⚠️ Cuidado con:

1. **Signals vs Getters**: En el nuevo componente usa `computed()` en lugar de getters
2. **Eventos**: Asegúrate de que todos los eventos se emitan correctamente
3. **Servicios**: Inyecta solo los servicios que necesita el componente
4. **Imports**: Verifica que todos los imports estén correctos

### ✅ Buenas prácticas:

1. **Inputs inmutables**: No modifiques los inputs directamente
2. **Outputs para comunicación**: Usa outputs para comunicarte con el padre
3. **Computed para derivados**: Usa `computed()` para valores derivados
4. **Signals para estado**: Usa `signal()` para estado interno

---

## 🎯 Resultado Final

### Ventajas obtenidas:

- ✅ Código más organizado y mantenible
- ✅ Componente reutilizable en otras páginas
- ✅ Mejor performance (change detection aislado)
- ✅ Más fácil de testear
- ✅ Separación clara de responsabilidades

### Uso en otros lugares:

```html
<!-- En cualquier otra página -->
<app-pdf-metadata-table
  [pdfContainer]="myPdfData"
  [maxFileSize]="customLimit"
  (exportMetadata)="handleExport()"
  (clearMetadata)="handleClear()"
/>
```

---

## 📚 Referencias

- [Angular Components](https://angular.dev/guide/components)
- [Angular Signals](https://angular.dev/guide/signals)
- [Component Communication](https://angular.dev/guide/components/inputs)
- [Standalone Components](https://angular.dev/guide/components/importing)

---

## ❓ Preguntas Frecuentes

### ¿Debo mover TODOS los métodos al nuevo componente?

No, solo los relacionados con la tabla de metadata. Los métodos de upload, processing, etc. quedan en `home`.

### ¿Qué pasa con los servicios compartidos?

Los servicios se inyectan donde se necesiten. Si ambos componentes usan `PdfMetadataService`, ambos lo inyectan.

### ¿Puedo tener múltiples instancias del componente?

Sí, cada instancia tendrá su propio estado (paginación, filtros, etc.).

### ¿Cómo manejo el estado compartido?

Usa un servicio con signals para estado compartido entre componentes.

---

**¿Necesitas ayuda con algún paso específico? ¡Pregúntame!** 🚀
