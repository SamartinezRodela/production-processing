# Guía: Ejecutar Scripts .py y Ejecutables .exe en el Backend

## 📋 Descripción

Esta guía explica cómo el backend de NestJS puede procesar tanto scripts de Python (`.py`) como ejecutables compilados (`.exe`), detectando automáticamente el tipo de archivo y ejecutándolo correctamente.

---

## 🏗️ Arquitectura

### Estructura de Carpetas

```
nest-files-py-embedded/
├── executables/              # Ejecutables .exe
│   ├── mi_programa.exe
│   └── convertidor.exe
├── saludar.py               # Scripts Python
├── generar_pdf.py
├── test_imports.py
└── python.exe               # Python embebido
```

### Flujo de Ejecución

```
Cliente (Frontend)
    ↓
POST /python/execute-file
    ↓
PythonController
    ↓
PythonService.executeFile()
    ↓
    ├─→ .py → executeScript() → python.exe script.py args
    └─→ .exe → executeExecutable() → script.exe args
    ↓
Resultado JSON
```

---

## 🔧 Métodos Disponibles

### 1. `executeScript(scriptName, args)` - Ejecutar .py

Ejecuta un script Python usando el intérprete embebido.

```typescript
// Ejemplo interno
await pythonService.executeScript("saludar.py", ["Juan"]);
```

**Comando ejecutado:**

```bash
python.exe saludar.py Juan
```

---

### 2. `executeExecutable(exeName, args)` - Ejecutar .exe

Ejecuta un archivo ejecutable directamente (sin Python).

```typescript
// Ejemplo interno
await pythonService.executeExecutable("mi_programa.exe", ["arg1", "arg2"]);
```

**Comando ejecutado:**

```bash
executables/mi_programa.exe arg1 arg2
```

---

### 3. `executeFile(fileName, args)` - Detección Automática

Detecta automáticamente si es `.py` o `.exe` y ejecuta el método correspondiente.

```typescript
// Ejemplo interno
await pythonService.executeFile("saludar.py", ["Juan"]);
await pythonService.executeFile("programa.exe", ["dato"]);
```

---

## 🌐 Endpoints API

### 1. POST `/python/execute-file` - Endpoint Unificado

Ejecuta cualquier archivo `.py` o `.exe` automáticamente.

**Request:**

```json
{
  "fileName": "saludar.py",
  "args": ["Juan"]
}
```

**Response (éxito):**

```json
{
  "success": true,
  "fileName": "saludar.py",
  "fileType": ".py",
  "result": {
    "mensaje": "Hola Juan",
    "status": "success"
  }
}
```

**Response (error):**

```json
{
  "message": "Error al ejecutar archivo",
  "fileName": "saludar.py",
  "error": "Script failed",
  "details": { ... }
}
```

---

### 2. POST `/python/execute-exe` - Específico para .exe

Ejecuta solo archivos `.exe` con validación estricta.

**Request:**

```json
{
  "exeName": "mi_programa.exe",
  "args": ["input.txt", "output.txt"]
}
```

**Response:**

```json
{
  "success": true,
  "exeName": "mi_programa.exe",
  "result": {
    "processed": true,
    "files": 2
  }
}
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Ejecutar Script Python

**Desde el Frontend:**

```typescript
const response = await fetch("http://localhost:3000/python/execute-file", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileName: "saludar.py",
    args: ["Maria"],
  }),
});

const data = await response.json();
console.log(data.result); // { mensaje: "Hola Maria", status: "success" }
```

---

### Ejemplo 2: Ejecutar Ejecutable .exe

**Desde el Frontend:**

```typescript
const response = await fetch("http://localhost:3000/python/execute-file", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileName: "convertidor.exe",
    args: ["archivo.txt", "salida.pdf"],
  }),
});

const data = await response.json();
console.log(data.result);
```

---

### Ejemplo 3: Usar Endpoint Específico para .exe

**Desde el Frontend:**

```typescript
const response = await fetch("http://localhost:3000/python/execute-exe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    exeName: "procesador.exe",
    args: ["--mode", "fast", "--input", "data.json"],
  }),
});
```

---

## 🛠️ Crear un Ejecutable .exe de Prueba

### Opción 1: Desde Python con PyInstaller

1. **Crear script Python:**

```python
# test_exe.py
import sys
import json

def main():
    nombre = sys.argv[1] if len(sys.argv) > 1 else "Mundo"
    resultado = {
        "mensaje": f"Hola desde .exe: {nombre}",
        "status": "success",
        "args_recibidos": sys.argv[1:]
    }
    print(json.dumps(resultado))

if __name__ == "__main__":
    main()
```

2. **Compilar a .exe:**

```bash
pip install pyinstaller
pyinstaller --onefile test_exe.py
```

3. **Copiar a la carpeta:**

```bash
copy dist\test_exe.exe nest-files-py-embedded\executables\
```

---

### Opción 2: Ejecutable Simple en C++

```cpp
// test.cpp
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    std::string nombre = (argc > 1) ? argv[1] : "Mundo";
    std::cout << "{\"mensaje\":\"Hola desde C++: " << nombre
              << "\",\"status\":\"success\"}" << std::endl;
    return 0;
}
```

**Compilar:**

```bash
g++ test.cpp -o test.exe
```

---

## ✅ Validaciones Implementadas

### En el Controller:

1. **Validación de nombre de archivo:**
   - Verifica que `fileName` no esté vacío
2. **Validación de extensión:**
   - Solo permite `.py` y `.exe`
   - Rechaza otros tipos de archivo

3. **Validación específica para .exe:**
   - El endpoint `/execute-exe` solo acepta archivos `.exe`

### En el Service:

1. **Detección automática de tipo:**
   - Usa `path.extname()` para identificar la extensión
2. **Manejo de errores:**
   - Captura errores de ejecución
   - Logs detallados para debugging
   - Mensajes de ayuda cuando falla

---

## 🔒 Consideraciones de Seguridad

### Implementadas:

✅ Validación de extensiones permitidas  
✅ Logs de todas las ejecuciones  
✅ Manejo de errores robusto  
✅ Separación de carpetas (scripts vs executables)

### Recomendadas para Producción:

⚠️ **Whitelist de archivos permitidos:**

```typescript
const ALLOWED_FILES = ["saludar.py", "generar_pdf.py", "procesador.exe"];
if (!ALLOWED_FILES.includes(body.fileName)) {
  throw new HttpException("Archivo no permitido", HttpStatus.FORBIDDEN);
}
```

⚠️ **Sanitización de argumentos:**

```typescript
const sanitizeArgs = (args: string[]) => {
  return args.map((arg) => arg.replace(/[;&|`$]/g, ""));
};
```

⚠️ **Timeout para procesos:**

```typescript
const timeout = setTimeout(() => {
  process.kill();
  reject(new Error("Timeout: proceso excedió 30 segundos"));
}, 30000);
```

⚠️ **Verificar existencia del archivo:**

```typescript
import { existsSync } from "fs";
if (!existsSync(filePath)) {
  throw new Error("Archivo no encontrado");
}
```

---

## 🧪 Testing

### Test Manual con cURL:

**Ejecutar script .py:**

```bash
curl -X POST http://localhost:3000/python/execute-file \
  -H "Content-Type: application/json" \
  -d "{\"fileName\":\"saludar.py\",\"args\":[\"Juan\"]}"
```

**Ejecutar ejecutable .exe:**

```bash
curl -X POST http://localhost:3000/python/execute-file \
  -H "Content-Type: application/json" \
  -d "{\"fileName\":\"test.exe\",\"args\":[\"Maria\"]}"
```

**Endpoint específico para .exe:**

```bash
curl -X POST http://localhost:3000/python/execute-exe \
  -H "Content-Type: application/json" \
  -d "{\"exeName\":\"test.exe\",\"args\":[\"Pedro\"]}"
```

---

## 📊 Debug y Logs

### Ver información de rutas:

```bash
GET http://localhost:3000/python/debug-paths
```

**Response:**

```json
{
  "scriptsPath": "C:\\Projects\\NEST-UI-V2\\nest-files-py-embedded",
  "executablesPath": "C:\\Projects\\NEST-UI-V2\\nest-files-py-embedded\\executables",
  "pythonExecutable": "C:\\Projects\\NEST-UI-V2\\nest-files-py-embedded\\python.exe",
  "platform": "win32",
  "isProduction": false
}
```

### Logs en Consola:

```
[PythonService] Detectando tipo de archivo: test.exe (.exe)
[PythonService] Ejecutando como ejecutable
[PythonService] Executables path: C:\...\nest-files-py-embedded\executables
[PythonService] Ejecutable completo: C:\...\executables\test.exe
[PythonService] Ejecutando: C:\...\test.exe con args: arg1 arg2
[PythonService] Ejecutable ejecutado exitosamente
```

---

## 🚀 Próximos Pasos

1. **Agregar más ejecutables** a la carpeta `executables/`
2. **Implementar whitelist** de archivos permitidos
3. **Agregar timeout** para procesos largos
4. **Crear tests unitarios** para los nuevos métodos
5. **Documentar** cada ejecutable y sus argumentos

---

## 📚 Resumen

### Archivos Modificados:

- ✅ `nest-ui-be/src/python/python.service.ts` - Agregados métodos `executeExecutable()` y `executeFile()`
- ✅ `nest-ui-be/src/python/python.controller.ts` - Agregados endpoints `/execute-file` y `/execute-exe`

### Carpetas Creadas:

- ✅ `nest-files-py-embedded/executables/` - Para almacenar archivos `.exe`

### Endpoints Disponibles:

- ✅ `POST /python/execute-file` - Ejecuta .py o .exe automáticamente
- ✅ `POST /python/execute-exe` - Ejecuta solo .exe con validación
- ✅ `GET /python/debug-paths` - Información de debug

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo ejecutar otros tipos de archivos?**  
R: No, por seguridad solo se permiten `.py` y `.exe`. Para agregar más tipos, modifica la validación en el controller.

**P: ¿Los .exe necesitan Python instalado?**  
R: No, los `.exe` se ejecutan directamente sin necesidad de Python.

**P: ¿Dónde pongo mis archivos .exe?**  
R: En la carpeta `nest-files-py-embedded/executables/`

**P: ¿Cómo paso argumentos con espacios?**  
R: Usa un array: `["arg con espacios", "otro arg"]`

**P: ¿Qué pasa si el .exe no retorna JSON?**  
R: El servicio intentará parsear la salida como JSON y fallará si no es válido. Asegúrate de que tus ejecutables retornen JSON válido.

---

**Fecha:** Marzo 2026  
**Versión:** 1.0.0
