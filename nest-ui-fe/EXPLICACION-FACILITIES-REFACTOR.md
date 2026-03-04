# 🔄 Refactor: Una Sola Fuente de Datos para Facilities

## 📋 Problema Original

Tenías **dos fuentes de datos** para lo mismo:

```typescript
// ❌ ANTES - Datos duplicados
facilities = signal<Facility[]>([
  { id: '1', name: 'Reynosa' },
  { id: '2', name: 'Facility B' },
]);

facilityOptions: SelectOption[] = [
  { value: '1', label: 'Facility A' },  // ⚠️ Nombre diferente!
  { value: '2', label: 'Facility B' },
];
```

**Problemas:**

- ❌ Datos duplicados
- ❌ Nombres inconsistentes ('Reynosa' vs 'Facility A')
- ❌ Necesitas método `updateFacilityOptions()` para sincronizar
- ❌ Fácil olvidar actualizar ambos
- ❌ Más código para mantener

---

## ✅ Solución: Computed Property (Getter)

Ahora usas **una sola fuente de datos** y generas las opciones automáticamente:

```typescript
// ✅ DESPUÉS - Una sola fuente de datos
facilities = signal<Facility[]>([
  { id: '1', name: 'Reynosa' },
  { id: '2', name: 'Facility B' },
]);

// Getter que genera las opciones automáticamente
get facilityOptions(): SelectOption[] {
  return this.facilities().map((facility) => ({
    value: facility.id,
    label: facility.name,
  }));
}
```

---

## 🎯 Cómo Funciona

### 1. Fuente de Datos Única

```typescript
facilities = signal<Facility[]>([
  { id: '1', name: 'Reynosa' },
  { id: '2', name: 'Facility B' },
]);
```

Esta es tu **única fuente de verdad**.

### 2. Getter Automático

```typescript
get facilityOptions(): SelectOption[] {
  return this.facilities().map((facility) => ({
    value: facility.id,
    label: facility.name,
  }));
}
```

**Qué hace:**

- Lee `facilities()` (el signal)
- Transforma cada `Facility` en un `SelectOption`
- `id` → `value`
- `name` → `label`

**Cuándo se ejecuta:**

- Cada vez que accedes a `facilityOptions`
- Siempre está sincronizado con `facilities`

### 3. Uso en el Template

```html
<!-- El template no cambia -->
<app-select
  [options]="facilityOptions"
  [value]="selectedFacility()"
  (valueChange)="selectedFacility.set($event)"
/>
```

---

## 🔄 Flujo de Actualización

### Antes (Manual):

```typescript
// 1. Agregar facility
this.facilities.set([...this.facilities(), newFacility]);

// 2. ⚠️ Tienes que recordar actualizar las opciones
this.updateFacilityOptions(); // ← Fácil de olvidar!
```

### Ahora (Automático):

```typescript
// 1. Agregar facility
this.facilities.set([...this.facilities(), newFacility]);

// 2. ✅ Las opciones se actualizan automáticamente
// No necesitas hacer nada más!
```

---

## 📝 Cambios Realizados

### 1. Eliminado `facilityOptions` como propiedad

```typescript
// ❌ ANTES
facilityOptions: SelectOption[] = [
  { value: '1', label: 'Facility A' },
  { value: '2', label: 'Facility B' },
];

// ✅ AHORA
get facilityOptions(): SelectOption[] {
  return this.facilities().map((facility) => ({
    value: facility.id,
    label: facility.name,
  }));
}
```

### 2. Eliminado método `updateFacilityOptions()`

```typescript
// ❌ ANTES - Ya no necesario
updateFacilityOptions(): void {
  this.facilityOptions = this.facilities().map((f) => ({
    value: f.id,
    label: f.name,
  }));
}
```

### 3. Eliminadas llamadas a `updateFacilityOptions()`

```typescript
// ❌ ANTES
saveFacility(): void {
  // ... código ...
  this.updateFacilityOptions();  // ← Ya no necesario
  this.closeModal();
}

// ✅ AHORA
saveFacility(): void {
  // ... código ...
  this.closeModal();  // ← Automático!
}
```

---

## 💡 Ventajas

### 1. Menos Código

```
Antes: ~15 líneas
Ahora: ~5 líneas
Reducción: 66%
```

### 2. Siempre Sincronizado

```typescript
// Cualquier cambio en facilities se refleja automáticamente
this.facilities.set([...this.facilities(), newFacility]);
// ✅ facilityOptions ya tiene el nuevo facility
```

### 3. Imposible Desincronizar

```typescript
// ❌ ANTES - Posible error
this.facilities.set([...this.facilities(), newFacility]);
// Olvidas llamar updateFacilityOptions()
// → facilityOptions desactualizado!

// ✅ AHORA - Imposible olvidar
this.facilities.set([...this.facilities(), newFacility]);
// → facilityOptions siempre actualizado automáticamente
```

### 4. Más Mantenible

```typescript
// Solo necesitas actualizar facilities
// Todo lo demás se actualiza solo
```

---

## 🧪 Ejemplos de Uso

### Agregar Facility

```typescript
addNewFacility(name: string): void {
  const newId = (this.facilities().length + 1).toString();

  // Solo actualizas facilities
  this.facilities.set([
    ...this.facilities(),
    { id: newId, name }
  ]);

  // ✅ facilityOptions se actualiza automáticamente
  // ✅ El select muestra la nueva opción inmediatamente
}
```

### Editar Facility

```typescript
editFacility(id: string, newName: string): void {
  // Solo actualizas facilities
  this.facilities.set(
    this.facilities().map(f =>
      f.id === id ? { ...f, name: newName } : f
    )
  );

  // ✅ facilityOptions se actualiza automáticamente
  // ✅ El select muestra el nombre actualizado
}
```

### Eliminar Facility

```typescript
removeFacility(id: string): void {
  // Solo actualizas facilities
  this.facilities.set(
    this.facilities().filter(f => f.id !== id)
  );

  // ✅ facilityOptions se actualiza automáticamente
  // ✅ El select ya no muestra la opción eliminada
}
```

---

## 🎓 Patrón: Computed Properties

Este es un patrón común en programación reactiva:

```typescript
// Datos base (source of truth)
data = signal<Data[]>([...]);

// Datos derivados (computed)
get derivedData(): DerivedData[] {
  return this.data().map(transform);
}
```

**Ventajas del patrón:**

- ✅ Una sola fuente de verdad
- ✅ Datos derivados siempre sincronizados
- ✅ Menos código
- ✅ Menos bugs
- ✅ Más fácil de entender

---

## 🔍 Comparación Completa

| Aspecto                 | Antes                            | Ahora               |
| ----------------------- | -------------------------------- | ------------------- |
| **Fuentes de datos**    | 2 (facilities + facilityOptions) | 1 (solo facilities) |
| **Sincronización**      | Manual (updateFacilityOptions)   | Automática (getter) |
| **Líneas de código**    | ~15                              | ~5                  |
| **Posibilidad de bugs** | Alta (olvidar sincronizar)       | Baja (automático)   |
| **Mantenibilidad**      | Media                            | Alta                |
| **Performance**         | Igual                            | Igual               |

---

## ⚠️ Nota sobre Performance

**¿El getter se ejecuta muchas veces?**

Sí, pero no es un problema porque:

1. **Es muy rápido:** Solo un `.map()` simple
2. **Angular optimiza:** Change detection inteligente
3. **Datos pequeños:** Pocas facilities (< 100 típicamente)

**Si tuvieras miles de facilities:**

```typescript
// Podrías usar un computed signal
facilityOptions = computed(() =>
  this.facilities().map((f) => ({
    value: f.id,
    label: f.name,
  })),
);
```

Pero para tu caso, el getter es perfecto.

---

## ✅ Resumen

### Antes:

```typescript
facilities = signal([...]);
facilityOptions = [...];  // ← Duplicado
updateFacilityOptions() { ... }  // ← Manual
```

### Ahora:

```typescript
facilities = signal([...]);  // ← Única fuente
get facilityOptions() { ... }  // ← Automático
```

**Resultado:**

- ✅ Menos código
- ✅ Más simple
- ✅ Menos bugs
- ✅ Siempre sincronizado
- ✅ Más mantenible

---

## 🎯 Aplicar el Mismo Patrón

Puedes aplicar este patrón a otros datos:

```typescript
// Ejemplo: Usuarios
users = signal<User[]>([...]);

get userOptions(): SelectOption[] {
  return this.users().map(u => ({
    value: u.id,
    label: u.name
  }));
}

// Ejemplo: Productos
products = signal<Product[]>([...]);

get productOptions(): SelectOption[] {
  return this.products().map(p => ({
    value: p.id,
    label: `${p.name} - $${p.price}`
  }));
}
```

---

## 📚 Recursos

- [Angular Signals](https://angular.io/guide/signals)
- [Computed Properties](https://angular.io/guide/signals#computed-values)
- [TypeScript Getters](https://www.typescriptlang.org/docs/handbook/2/classes.html#getters--setters)

---

¡Ahora tu código es más limpio, simple y mantenible! 🎉

---

## 🔧 Fix Aplicado: TypeScript Error en home.html

### Problema Encontrado

En `home.html` línea 60, había un error de tipo:

```html
<!-- ❌ ANTES - Error de tipo -->
<app-select
  [options]="facilityOptions"
  [placeholder]="'Select Facility'"
  [(value)]="selectedFacility()"
  [placeholder]="'Buscar y seleccionar...'"  <!-- ⚠️ Duplicado -->
  (valueChange)="selectedFacility.set($event)"  <!-- ⚠️ Error: $event es string | number -->
/>
```

**Problemas:**

1. `app-select` emite `string | number` pero `selectedFacility.set()` espera solo `string`
2. Atributo `[placeholder]` duplicado

### Solución Aplicada

```typescript
// En home.ts - Agregado método helper
onFacilityChange(value: string | number): void {
  this.selectedFacility.set(value.toString());
}
```

```html
<!-- ✅ AHORA - Sin errores -->
<app-select
  [options]="facilityOptions"
  [placeholder]="'Buscar y seleccionar...'"
  [(value)]="selectedFacility()"
  [selectClass]="'h-9 text-sm'"
  [searchable]="true"
  (valueChange)="onFacilityChange($event)"
/>
```

### Cambios Realizados

1. ✅ Agregado método `onFacilityChange()` que convierte `string | number` a `string`
2. ✅ Removido atributo `[placeholder]` duplicado
3. ✅ Conectado `(valueChange)` al nuevo método helper

### Resultado

- ✅ Sin errores de TypeScript
- ✅ Facility selection funciona correctamente
- ✅ Conversión de tipo segura y explícita
