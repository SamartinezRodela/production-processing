# 🔍 Diagnóstico de Problemas en Producción

## Error Actual

```
Error invoking remote method 'python:generar-pdf': [object Object]
Error invoking remote method 'python:saludar': [object Object]
```

Este error indica que hay un problema en la comunicación entre Electron y el backend.

---

## 🛠️ Pasos para Diagnosticar

### Paso 1: Recompilar con Logging Mejorado

```powershell
# 1. Recompilar Electron con el nuevo logging
cd nest-electron
npm run build

# 2. Crear nuevo instalador
cd ..
.\package-app.ps1
```

### Paso 2: Instalar y Abrir Logs

1. Instala el nuevo `.exe`
2. Abre la aplicación
3. En el menú superior, ve a: **Ayuda → Ver Logs del Backend**
4. Se abrirá el archivo `backend.log`

### Paso 3: Revisar los Logs

Busca estos mensajes en `backend.log`:

#### ✅ Si el backend inicia correctamente:

```
[STDOUT] 2024-02-20T... - [Nest] Starting Nest application...
[STDOUT] 2024-02-20T... - [NestApplication] Nest application successfully started
```

#### ❌ Si hay error de módulos:

```
[STDERR] Error: Cannot find module '@nestjs/core'
```

**Solución:** Falta copiar node_modules correctamente

#### ❌ Si hay error de Python:

```
[STDERR] Python no está instalado o no está en el PATH
```

**Solución:** Instalar Python en la máquina

#### ❌ Si hay error de rutas:

```
[STDERR] ENOENT: no such file or directory
```

**Solución:** Verificar rutas en package.json

---

## 🔧 Soluciones Comunes

### Problema 1: Backend no inicia

**Verificar que el backend esté empaquetado:**

```powershell
# Verificar que existe
Test-Path "nest-electron/release/win-unpacked/resources/backend/dist/main.js"
```

Si no existe, el problema está en `package.json`. Verifica:

```json
"extraResources": [
  {
    "from": "../nest-ui-be/dist",
    "to": "backend/dist",  // ← Debe ser backend/dist
    "filter": ["**/*"]
  }
]
```

**Corrección en main.ts:**

```typescript
const backendPath = path.join(
  process.resourcesPath,
  "backend",
  "dist",
  "main.js",
);
// NO: "backend", "main.js"
```

### Problema 2: Python no encontrado

**Verificar Python:**

```powershell
py --version
```

Si no está instalado:

1. Descargar de https://www.python.org/downloads/
2. Durante instalación, marcar "Add Python to PATH"
3. Reiniciar la aplicación

### Problema 3: Scripts Python no encontrados

**Verificar que los scripts estén empaquetados:**

```powershell
# Verificar carpeta python
Test-Path "nest-electron/release/win-unpacked/resources/python"
```

Debe contener:

- `saludar.py`
- `generar_pdf.py`
- Otros scripts `.py`

### Problema 4: Dependencias de Python faltantes

Si el error es:

```
ModuleNotFoundError: No module named 'reportlab'
```

**Solución:**

```powershell
pip install reportlab
```

---

## 🧪 Pruebas Manuales

### Probar Backend Manualmente

1. Navega a la carpeta de instalación:

```powershell
cd "C:\Users\TuUsuario\AppData\Local\Programs\Production Processing\resources\backend"
```

2. Ejecuta el backend:

```powershell
node dist/main.js
```

3. Deberías ver:

```
[Nest] Starting Nest application...
[Nest] Nest application successfully started
```

4. Prueba un endpoint:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/python/debug-paths" -Method Get
```

### Probar Scripts Python Manualmente

1. Navega a la carpeta python:

```powershell
cd "C:\Users\TuUsuario\AppData\Local\Programs\Production Processing\resources\python"
```

2. Ejecuta un script:

```powershell
py saludar.py "Alex"
```

3. Deberías ver:

```json
{
  "success": true,
  "mensaje": "Hola Alex! Bienvenido",
  ...
}
```

---

## 📋 Checklist de Verificación

Antes de crear el instalador, verifica:

- [ ] Backend compila sin errores: `cd nest-ui-be && npm run build`
- [ ] Frontend compila sin errores: `cd nest-ui-fe && npm run build`
- [ ] Electron compila sin errores: `cd nest-electron && npm run build`
- [ ] Scripts Python existen en `nest-files-py/`
- [ ] `package.json` tiene rutas correctas en `extraResources`
- [ ] Python está instalado en la máquina de prueba
- [ ] Dependencias de Python instaladas (`pip install reportlab`)

---

## 🔍 Verificar Estructura del Instalador

Después de crear el instalador, verifica la estructura:

```powershell
cd nest-electron/release/win-unpacked/resources
ls
```

Debe tener:

```
resources/
├── backend/
│   ├── dist/
│   │   └── main.js
│   ├── node_modules/
│   └── package.json
├── frontend/
│   ├── index.html
│   └── ...
└── python/
    ├── saludar.py
    ├── generar_pdf.py
    └── ...
```

---

## 🚨 Error Común: Ruta Incorrecta del Backend

Si el log dice:

```
Error: Cannot find module 'C:\...\resources\backend\main.js'
```

El problema es que `main.js` está en `backend/dist/main.js`, no en `backend/main.js`.

**Solución:** Ya lo corregimos en `main.ts`:

```typescript
const backendPath = path.join(
  process.resourcesPath,
  "backend",
  "dist",
  "main.js",
);
```

---

## 📞 Obtener Información de Debug

Agrega este código temporal en el frontend para ver qué está pasando:

```typescript
// En home.ts
async debugInfo() {
  try {
    const response = await fetch('http://localhost:3000/python/debug-paths');
    const data = await response.json();
    console.log('Debug Info:', data);
    alert(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Backend no responde:', error);
    alert('Backend no está corriendo o no responde');
  }
}
```

Llama a esta función desde un botón para ver si el backend está corriendo.

---

## ✅ Solución Paso a Paso

1. **Recompilar todo:**

```powershell
.\build-all.ps1
```

2. **Crear instalador:**

```powershell
.\package-app.ps1
```

3. **Instalar la aplicación**

4. **Abrir logs:**
   - Menú → Ayuda → Ver Logs del Backend

5. **Revisar errores en el log**

6. **Aplicar solución según el error**

7. **Repetir hasta que funcione**

---

## 🎯 Próximos Pasos

Una vez que identifiques el error en los logs, vuelve aquí y busca la solución correspondiente.

Si el error no está listado, comparte el contenido de `backend.log` para ayudarte mejor.
