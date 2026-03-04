# 📚 Documentación Frontend - NEST UI (Angular)

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Tecnologías Principales](#tecnologías-principales)
4. [Componentes Compartidos](#componentes-compartidos)
5. [Páginas](#páginas)
6. [Servicios](#servicios)
7. [Comandos Esenciales](#comandos-esenciales)
8. [Guía de Desarrollo](#guía-de-desarrollo)

---

## 🎯 Descripción General

**NEST UI Frontend** es una aplicación Angular 21 con estilo de escritorio moderno, diseñada para funcionar dentro de Electron. Utiliza Tailwind CSS para estilos y Lucide Angular para iconos.

### Características Principales:

- ✅ Diseño estilo aplicación de escritorio (Windows/macOS)
- ✅ Sistema de componentes reutilizables
- ✅ Integración con Electron via IPC
- ✅ Comunicación con backend NestJS
- ✅ Ejecución de scripts Python
- ✅ Sistema de modales y alertas
- ✅ Gestión de configuraciones

---

## 📁 Estructura del Proyecto

```
nest-ui-fe/
├── src/
│   ├── app/
│   │   ├── components/          # Componentes de UI
│   │   │   ├── shared/          # Componentes reutilizables
│   │   │   │   ├── button/      # Botón personalizado
│   │   │   │   ├── icon/        # Iconos (Lucide)
│   │   │   │   ├── input/       # Input personalizado
│   │   │   │   ├── modal/       # Sistema de modales
│   │   │   │   ├── select/      # Select dropdown
│   │   │   │   └── footer/      # Footer
│   │   │   ├── alert/           # Componente de alertas
│   │   │   └── navbar/          # Barra de navegación
│   │   │
│   │   ├── pages/               # Páginas de la aplicación
│   │   │   ├── home/            # Página principal (Production Processing)
│   │   │   ├── set-up/          # Página de configuración
│   │   │   └── python-test/     # Página de pruebas Python
│   │   │
│   │   ├── service/             # Servicios
│   │   │   ├── electron.service.ts    # Comunicación con Electron
│   │   │   └── alert.service.ts       # Gestión de alertas
│   │   │
│   │   ├── app.routes.ts        # Configuración de rutas
│   │   ├── app.config.ts        # Configuración de la app
│   │   └── app.ts               # Componente raíz
│   │
│   ├── index.html               # HTML principal
│   ├── main.ts                  # Punto de entrada
│   └── styles.css               # Estilos globales (Tailwind)
│
├── public/                      # Archivos estáticos
│   └── favicon.ico
│
├── package.json                 # Dependencias y scripts
├── angular.json                 # Configuración de Angular
├── tsconfig.json                # Configuración de TypeScript
└── tailwind.config.js           # Configuración de Tailwind (si existe)
```

---

## 🛠️ Tecnologías Principales

### Framework y Librerías

| Tecnología         | Versión | Propósito                  |
| ------------------ | ------- | -------------------------- |
| **Angular**        | 21.1.0  | Framework principal        |
| **TypeScript**     | 5.9.2   | Lenguaje de programación   |
| **Tailwind CSS**   | 4.1.12  | Framework de estilos       |
| **RxJS**           | 7.8.0   | Programación reactiva      |
| **Lucide Angular** | 0.575.0 | Librería de iconos         |
| **@ng-select**     | 21.4.0  | Componente select avanzado |
| **Vitest**         | 4.0.8   | Testing framework          |

### Herramientas de Desarrollo

- **Angular CLI** - Herramientas de línea de comandos
- **PostCSS** - Procesamiento de CSS
- **Prettier** - Formateo de código
- **JSDOM** - Testing DOM

---

## 🧩 Componentes Compartidos

### 1. Button (`app-button`)

**Ubicación:** `src/app/components/shared/button/`

Botón personalizado con múltiples variantes y soporte para iconos.

**Props:**

```typescript
label: string = 'Button'           // Texto del botón
type: 'button' | 'submit' | 'reset' = 'button'
variant: 'primary' | 'secondary' | 'danger' | 'dark' | 'white' | 'ghost' = 'primary'
disabled: boolean = false
size: 'sm' | 'md' | 'lg' = 'md'
customClass: string = ''
icon: string = ''                  // Nombre del icono (Lucide)
iconPosition: 'left' | 'right' | 'only' = 'left'
iconSize: number = 20
```

**Eventos:**

```typescript
clicked: void  // Emitido al hacer click
```

**Ejemplo de uso:**

```html
<app-button
  [label]="'Save'"
  [variant]="'primary'"
  [icon]="'check'"
  [iconPosition]="'left'"
  (clicked)="save()"
/>
```

---

### 2. Icon (`app-icon`)

**Ubicación:** `src/app/components/shared/icon/`

Wrapper para iconos de Lucide Angular.

**Props:**

```typescript
name: string (required)  // Nombre del icono
size: number = 24        // Tamaño en píxeles
class: string = ''       // Clases CSS adicionales
```

**Iconos disponibles:**

- home, user, search, mail, phone, build, key
- filter, qr, edit, trash, alert, alert-triangle
- chart, menu, close, copy, download, check
- plus, cancel, ok, logOut, settings, shield
- eraser, eye, eye-off, clock, more, history
- inbox, calendar, cloud-upload, upload
- folder, folder-open, arrow-left, rotate-ccw

**Ejemplo de uso:**

```html
<app-icon [name]="'settings'" [size]="20" class="text-gray-600" />
```

---

### 3. Modal (`app-modal`)

**Ubicación:** `src/app/components/shared/modal/`

Sistema de modales con backdrop blur y animaciones.

**Props:**

```typescript
isOpen: boolean = false
title: string = 'Modal Title'
size: 'sm' | 'md' | 'lg' = 'md'
```

**Eventos:**

```typescript
closed: void  // Emitido al cerrar el modal
```

**Características:**

- Backdrop con blur y opacidad
- Animaciones suaves (fade-in + scale-in)
- Cierre con click en backdrop o botón X
- Bloqueo de scroll del body
- Header y footer sticky

**Ejemplo de uso:**

```html
<app-modal [isOpen]="isModalOpen()" [title]="'Edit Facility'" [size]="'sm'" (closed)="closeModal()">
  <!-- Contenido del modal -->
  <div>
    <input type="text" [(ngModel)]="facilityName" />
  </div>

  <!-- Footer del modal -->
  <div footer class="flex justify-end gap-2">
    <app-button [label]="'Cancel'" (clicked)="closeModal()" />
    <app-button [label]="'Save'" [variant]="'primary'" (clicked)="save()" />
  </div>
</app-modal>
```

---

### 4. Select (`app-select`)

**Ubicación:** `src/app/components/shared/select/`

Dropdown select personalizado basado en @ng-select.

**Props:**

```typescript
options: SelectOption[]  // Array de opciones
placeholder: string = 'Select...'
value: any               // Valor seleccionado (two-way binding)
icon: string = ''        // Icono opcional
iconSize: number = 20
selectClass: string = '' // Clases CSS adicionales
```

**Interface SelectOption:**

```typescript
interface SelectOption {
  value: string | number;
  label: string;
}
```

**Ejemplo de uso:**

```html
<app-select
  [options]="facilityOptions"
  [placeholder]="'Select Facility'"
  [(value)]="selectedFacility"
  [selectClass]="'h-10 text-sm'"
/>
```

---

### 5. Input (`app-input`)

**Ubicación:** `src/app/components/shared/input/`

Input de texto personalizado con validación.

---

### 6. Footer (`app-footer`)

**Ubicación:** `src/app/components/shared/footer/`

Footer de la aplicación.

---

## 📄 Páginas

### 1. Home (Production Processing)

**Ruta:** `/Home` (página por defecto)  
**Ubicación:** `src/app/pages/home/`

**Descripción:**  
Página principal para procesamiento de archivos de producción.

**Características:**

- Drag & drop de archivos
- Filtros por Facility y Process Type
- Lista de archivos seleccionados
- Barra de progreso
- Log de errores
- Validación de archivos (tamaño, tipo)

**Signals principales:**

```typescript
isDragging = signal(false);
selectedFiles = signal<File[]>([]);
errorLog = signal<FileError[]>([]);
isProcessing = signal(false);
progress = signal(0);
filterType = signal<string>('Facility A');
ProcessType = signal<string>('Order A');
```

**Métodos principales:**

- `onDragOver()` - Maneja el evento drag over
- `onDrop()` - Maneja el drop de archivos
- `validateAndAddFiles()` - Valida archivos antes de agregar
- `uploadFiles()` - Inicia el procesamiento
- `removeFile()` - Elimina un archivo de la lista
- `clearErrorLog()` - Limpia el log de errores

---

### 2. Set-Up (Settings)

**Ruta:** `/Set-Up`  
**Ubicación:** `src/app/pages/set-up/`

**Descripción:**  
Página de configuración de la aplicación.

**Características:**

- Selección de sistema operativo (Windows/macOS)
- Configuración de ruta base
- Gestión de facilities (agregar, editar, eliminar)
- Modal de confirmación para acciones destructivas
- Guardado en localStorage
- Reset a valores por defecto

**Signals principales:**

```typescript
operatingSystem = signal<'windows' | 'macos'>('windows')
basePath = signal('C:\\Production\\Base_Files')
facilities = signal<Facility[]>([...])
selectedFacility = signal<string>('1')
isModalOpen = signal(false)
isConfirmModalOpen = signal(false)
```

**Métodos principales:**

- `setOS()` - Cambia el sistema operativo
- `browsePath()` - Abre selector de carpeta (Electron)
- `addFacility()` - Abre modal para agregar facility
- `editFacility()` - Abre modal para editar facility
- `removeFacility()` - Abre modal de confirmación para eliminar
- `save()` - Guarda configuración en localStorage
- `resetToDefaults()` - Resetea a valores por defecto

---

### 3. Python-Test

**Ruta:** `/Python-Test`  
**Ubicación:** `src/app/pages/python-test/`

**Descripción:**  
Página para probar la ejecución de scripts Python.

**Características:**

- Ejecuta scripts Python via Electron → NestJS → Python
- Muestra resultados en tiempo real
- Manejo de errores

---

## 🔧 Servicios

### 1. ElectronService

**Ubicación:** `src/app/service/electron.service.ts`

**Descripción:**  
Servicio para comunicación con Electron via IPC.

**Métodos principales:**

```typescript
// Verifica si está corriendo en Electron
isElectron(): boolean

// Ejecuta script Python
executePython(scriptName: string, args?: string[]): Promise<any>

// Abre selector de carpeta
selectFolder(): Promise<string>

// Abre carpeta en el explorador
openFolder(path: string): void
```

**Ejemplo de uso:**

```typescript
constructor(private electronService: ElectronService) {}

async runPython() {
  if (this.electronService.isElectron()) {
    const result = await this.electronService.executePython('hello.py');
    console.log(result);
  }
}
```

---

### 2. AlertService

**Ubicación:** `src/app/service/alert.service.ts`

**Descripción:**  
Servicio para gestión de alertas y notificaciones.

**Métodos principales:**

```typescript
showSuccess(message: string): void
showError(message: string): void
showWarning(message: string): void
showInfo(message: string): void
```

---

## 🚀 Comandos Esenciales

### Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 4200)
npm start

# Compilar en modo watch
npm run watch

# Ejecutar tests
npm test
```

### Producción

```bash
# Compilar para producción
npm run build

# Los archivos compilados estarán en: dist/nest-ui-fe/
```

### Angular CLI

```bash
# Generar componente
ng generate component components/mi-componente

# Generar servicio
ng generate service services/mi-servicio

# Generar página
ng generate component pages/mi-pagina
```

---

## 💻 Guía de Desarrollo

### 1. Crear un Nuevo Componente Compartido

```bash
# Crear carpeta y archivos
mkdir src/app/components/shared/mi-componente
cd src/app/components/shared/mi-componente

# Crear archivos
touch mi-componente.ts mi-componente.html mi-componente.css
```

**Estructura básica (mi-componente.ts):**

```typescript
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mi-componente',
  imports: [CommonModule],
  templateUrl: './mi-componente.html',
  styleUrl: './mi-componente.css',
})
export class MiComponente {
  // Props (inputs)
  label = input<string>('Default');
  disabled = input<boolean>(false);

  // Eventos (outputs)
  clicked = output<void>();

  // Métodos
  onClick() {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
```

---

### 2. Crear una Nueva Página

```bash
# Crear carpeta y archivos
mkdir src/app/pages/mi-pagina
cd src/app/pages/mi-pagina

# Crear archivos
touch mi-pagina.ts mi-pagina.html mi-pagina.css
```

**Agregar ruta en `app.routes.ts`:**

```typescript
import { MiPagina } from './pages/mi-pagina/mi-pagina';

export const routes: Routes = [
  // ... rutas existentes
  { path: 'Mi-Pagina', component: MiPagina },
];
```

---

### 3. Usar Signals (Reactividad)

```typescript
import { Component, signal } from '@angular/core';

export class MiComponente {
  // Crear signal
  count = signal(0);
  name = signal('John');

  // Leer valor
  getValue() {
    console.log(this.count()); // Nota los paréntesis
  }

  // Actualizar valor
  increment() {
    this.count.set(this.count() + 1);
  }

  // Actualizar con función
  updateName() {
    this.name.update((current) => current.toUpperCase());
  }
}
```

**En el template:**

```html
<p>Count: {{ count() }}</p>
<p>Name: {{ name() }}</p>
<button (click)="increment()">+1</button>
```

---

### 4. Estilos con Tailwind CSS

**Clases comunes usadas en el proyecto:**

```html
<!-- Layout -->
<div class="flex items-center justify-between gap-4">
  <div class="grid grid-cols-2 gap-4">
    <!-- Espaciado -->
    <div class="p-4 px-6 py-2 m-4 mx-auto">
      <!-- Colores -->
      <div class="bg-white text-gray-700 border-gray-200">
        <div class="bg-blue-600 text-white">
          <!-- Tipografía -->
          <h1 class="text-lg font-semibold">
            <p class="text-sm text-gray-500">
              <!-- Bordes y sombras -->
            </p>

            <div class="border border-gray-200 rounded-lg shadow-sm">
              <!-- Hover y estados -->
              <button class="hover:bg-gray-100 disabled:opacity-50">
                <!-- Responsive -->
                <div class="w-full max-w-3xl mx-auto"></div>
              </button>
            </div>
          </h1>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### 5. Integración con Electron

**Verificar si está en Electron:**

```typescript
if (this.electronService.isElectron()) {
  // Código específico de Electron
}
```

**Ejecutar Python:**

```typescript
const result = await this.electronService.executePython('script.py', ['arg1', 'arg2']);
```

**Abrir selector de carpeta:**

```typescript
const path = await this.electronService.selectFolder();
this.basePath.set(path);
```

---

### 6. Gestión de Estado con Signals

**Patrón recomendado:**

```typescript
export class MiComponente {
  // Estado
  isLoading = signal(false);
  data = signal<MyData[]>([]);
  error = signal<string | null>(null);

  // Acciones
  async loadData() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.service.getData();
      this.data.set(result);
    } catch (err) {
      this.error.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

---

### 7. Navegación entre Páginas

```typescript
import { Router } from '@angular/router';

export class MiComponente {
  constructor(private router: Router) {}

  goToSettings() {
    this.router.navigate(['/Set-Up']);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
```

---

## 📝 Convenciones de Código

### Nombres de Archivos

- Componentes: `mi-componente.ts`, `mi-componente.html`, `mi-componente.css`
- Servicios: `mi-servicio.service.ts`
- Páginas: `mi-pagina.ts`, `mi-pagina.html`, `mi-pagina.css`

### Nombres de Clases

- Componentes: `MiComponente` (PascalCase)
- Servicios: `MiServicioService` (PascalCase + Service)
- Interfaces: `IMiInterface` o `MiInterface` (PascalCase)

### Selectores

- Componentes: `app-mi-componente` (kebab-case con prefijo app-)

### Prettier Config

```json
{
  "printWidth": 100,
  "singleQuote": true
}
```

---

## 🎨 Paleta de Colores

### Colores Principales

- **Primary (Azul):** `#3b82f6` (blue-600)
- **Danger (Rojo):** `#dc2626` (red-600)
- **Success (Verde):** `#16a34a` (green-600)
- **Warning (Amarillo):** `#eab308` (yellow-500)

### Grises (Desktop Style)

- **Fondo:** `#f9fafb` (gray-50)
- **Bordes:** `#e5e7eb` (gray-200)
- **Texto principal:** `#1f2937` (gray-800)
- **Texto secundario:** `#6b7280` (gray-500)

---

## 🔗 Rutas de la Aplicación

| Ruta           | Componente          | Descripción                              |
| -------------- | ------------------- | ---------------------------------------- |
| `/`            | Redirect → `/Home`  | Redirección a Home                       |
| `/Home`        | Home                | Página principal (Production Processing) |
| `/Set-Up`      | SetUp               | Configuración de la aplicación           |
| `/Python-Test` | PythonTestComponent | Pruebas de Python                        |
| `/**`          | Redirect → `/Home`  | Cualquier ruta no encontrada             |

---

## 📦 Dependencias Clave

### Producción

```json
{
  "@angular/common": "^21.1.0",
  "@angular/core": "^21.1.0",
  "@angular/forms": "^21.1.0",
  "@angular/router": "^21.1.0",
  "@ng-select/ng-select": "^21.4.0",
  "lucide-angular": "^0.575.0",
  "rxjs": "~7.8.0"
}
```

### Desarrollo

```json
{
  "@angular/cli": "^21.1.4",
  "@tailwindcss/postcss": "^4.1.12",
  "tailwindcss": "^4.1.12",
  "typescript": "~5.9.2",
  "vitest": "^4.0.8"
}
```

---

## 🐛 Troubleshooting

### Problema: Angular no compila

```bash
# Limpiar cache y reinstalar
rm -rf node_modules .angular
npm install
```

### Problema: Tailwind no funciona

```bash
# Verificar que PostCSS esté configurado
# Verificar que styles.css tenga las directivas de Tailwind
```

### Problema: Electron no se comunica

```bash
# Verificar que ElectronService esté inyectado
# Verificar que window.electronAPI esté disponible
# Revisar preload.ts en nest-electron
```

---

## 📚 Recursos Adicionales

- [Angular Documentation](https://angular.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [RxJS](https://rxjs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

---

## ✅ Checklist de Desarrollo

- [ ] Instalar dependencias (`npm install`)
- [ ] Iniciar servidor de desarrollo (`npm start`)
- [ ] Verificar que corre en `http://localhost:4200`
- [ ] Probar navegación entre páginas
- [ ] Verificar integración con Electron
- [ ] Probar ejecución de Python
- [ ] Verificar estilos Tailwind
- [ ] Probar componentes compartidos
- [ ] Verificar modales y alertas
- [ ] Compilar para producción (`npm run build`)

---

**Última actualización:** Febrero 2025  
**Versión:** 1.0.0  
**Autor:** Equipo de Desarrollo NEST UI
