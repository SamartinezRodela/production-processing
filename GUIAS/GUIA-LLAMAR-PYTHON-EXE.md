# Guía: Cómo llamar un .exe de Python desde Backend, Frontend y Electron

## Resumen del Flujo Completo

```
Frontend (Angular) → HTTP/IPC → Backend (NestJS) → PythonService → .exe/.py
                                                         ↓
                                                   spawn(proceso)
                                                         ↓
                                                   JSON resultado
```

Hay **dos caminos** para llamar un .exe:

| Camino                                          | Cuándo usarlo                                                   |
| ----------------------------------------------- | --------------------------------------------------------------- |
| Frontend → HTTP → Backend → PythonService       | Cuando la app corre en navegador o necesitas lógica del backend |
| Frontend → IPC → Electron → ApiClient → Backend | Cuando la app corre dentro de Electron (escritorio)             |

---

## Paso 1: Crear el Script Python

Tu script Python debe seguir esta estructura para comunicarse con el backend:

```python
# mi_script.py
import sys
import json

def mi_funcion(datos):
    try:
        param1 = datos.get('param1', '')
        param2 = datos.get('param2', '')

        # Reportar progreso (opcional, para barra de progreso en el frontend)
        print(f"PROGRESS:25:{param1}", flush=True)

        # ... tu lógica aquí ...

        print(f"PROGRESS:100:{param1}", flush=True)

        # IMPORTANTE: Retornar siempre un diccionario con "success"
        return {
            "success": True,
            "mensaje": "Operación completada",
            "resultado": "lo que necesites"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    try:
        # Los argumentos llegan como JSON string desde sys.argv[1]
        datos = json.loads(sys.argv[1])
        resultado = mi_funcion(datos)
        # IMPORTANTE: El último print con JSON es lo que el backend lee
        print(json.dumps(resultado))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
```

### Reglas del script Python:

1. Recibir datos como JSON en `sys.argv[1]`
2. Imprimir el resultado final como JSON con `print(json.dumps(resultado))`
3. Siempre incluir `"success": True/False` en la respuesta
4. Para progreso usar: `print(f"PROGRESS:{porcentaje}:{nombre_archivo}", flush=True)`
5. Nunca hacer `print()` de texto libre (rompe el parseo JSON del backend)

---

## Paso 2: Compilar a .exe (opcional)

Si quieres distribuir como .exe en vez de .py:

```bash
# Usando PyInstaller
pip install pyinstaller
pyinstaller --onefile mi_script.py
```

El .exe resultante va en:

- Desarrollo: `nest-files-py-embedded/` o `nest-files-py-embedded/executables/`
- Producción: `resources/python/` o `resources/python/executables/`

Si prefieres usar .pyc (bytecode compilado), usa el script incluido:

```bash
python compile-python-scripts.py
```

---

## Paso 3: Backend (NestJS) - Registrar el endpoint

### 3.1 Agregar método en `python.service.ts`

```typescript
// nest-ui-be/src/python/python.service.ts

// Para ejecutar un .py (usa Python embebido)
async miFuncion(datos: { param1: string; param2: string }): Promise<any> {
  const datosJson = JSON.stringify(datos);
  return this.executeScript('mi_script.py', [datosJson]);
}

// Para ejecutar un .exe directamente
async miFuncionExe(datos: { param1: string; param2: string }): Promise<any> {
  const datosJson = JSON.stringify(datos);
  return this.executeExecutable('mi_script.exe', [datosJson]);
}

// Para auto-detectar por extensión (.py o .exe)
async miFuncionAuto(datos: { param1: string; param2: string }): Promise<any> {
  const datosJson = JSON.stringify(datos);
  return this.executeFile('mi_script.exe', [datosJson]); // detecta solo
}
```

**¿Qué hace cada método internamente?**

| Método                          | Qué hace                                                               |
| ------------------------------- | ---------------------------------------------------------------------- |
| `executeScript(name, args)`     | Ejecuta con Python embebido: `spawn(pythonExe, [scriptPath, ...args])` |
| `executeExecutable(name, args)` | Ejecuta el .exe directo: `spawn(exePath, args)`                        |
| `executeFile(name, args)`       | Detecta la extensión y llama al método correcto                        |

### 3.2 Agregar endpoint en `python.controller.ts`

```typescript
// nest-ui-be/src/python/python.controller.ts

@Post('mi-funcion')
async miFuncion(@Body() body: { param1: string; param2: string }) {
  try {
    if (!body.param1) {
      throw new HttpException('param1 es requerido', HttpStatus.BAD_REQUEST);
    }
    return await this.pythonService.miFuncion(body);
  } catch (error) {
    throw new HttpException(
      { message: 'Error ejecutando mi función', error: error.message || error },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
```

Ahora tienes el endpoint: `POST /python/mi-funcion`

---

## Paso 4: Frontend (Angular) - Llamar al endpoint

### Opción A: Llamada HTTP directa (funciona en navegador y Electron)

```typescript
// Desde cualquier servicio o componente Angular
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

// Inyectar HttpClient y ApiUrlService
const apiUrl = await this.apiUrlService.getApiUrl();

const resultado = await firstValueFrom(
  this.http.post<any>(`${apiUrl}/python/mi-funcion`, {
    param1: "valor1",
    param2: "valor2",
  }),
);

console.log(resultado); // { success: true, mensaje: '...', resultado: '...' }
```

### Opción B: Usando el endpoint genérico `execute-exe`

Si no quieres crear un endpoint específico, puedes usar los endpoints genéricos:

```typescript
// Ejecutar cualquier .exe
const resultado = await firstValueFrom(
  this.http.post<any>(`${apiUrl}/python/execute-exe`, {
    exeName: "mi_script.exe",
    args: [JSON.stringify({ param1: "valor1" })],
  }),
);

// Ejecutar cualquier .py o .exe (auto-detecta)
const resultado = await firstValueFrom(
  this.http.post<any>(`${apiUrl}/python/execute-file`, {
    fileName: "mi_script.exe", // o 'mi_script.py'
    args: [JSON.stringify({ param1: "valor1" })],
  }),
);
```

---

## Paso 5: Electron - Agregar IPC Handler (solo para app de escritorio)

Si necesitas llamar desde Electron directamente (sin pasar por HTTP del frontend):

### 5.1 Agregar método en `api-client.ts`

```typescript
// nest-electron/src/api-client.ts

static async pythonMiFuncion(
  datos: { param1: string; param2: string },
  token?: string
): Promise<any> {
  return this.post('/python/mi-funcion', datos, token);
}
```

### 5.2 Agregar IPC handler en `main.ts`

```typescript
// nest-electron/src/main.ts

ipcMain.handle(
  "python:mi-funcion",
  async (_event, datos: { param1: string; param2: string }, token?: string) => {
    try {
      const { ApiClient } = require("./api-client");
      return await ApiClient.pythonMiFuncion(datos, token);
    } catch (error: any) {
      throw new Error(
        `Error en mi-funcion: ${error.message || JSON.stringify(error)}`,
      );
    }
  },
);
```

### 5.3 Exponer en `preload.ts`

```typescript
// nest-electron/src/preload.ts
// Dentro de python: { ... }

miFuncion: (datos: { param1: string; param2: string }, token?: string) =>
  ipcRenderer.invoke('python:mi-funcion', datos, token),
```

### 5.4 Llamar desde Angular (dentro de Electron)

```typescript
// Desde un componente o servicio Angular
const resultado = await (window as any).electronAPI.python.miFuncion(
  { param1: "valor1", param2: "valor2" },
  this.authService.getToken(),
);
```

---

## Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular)                       │
│                                                                 │
│  Opción 1: HTTP directo          Opción 2: Via Electron IPC     │
│  http.post('/python/mi-funcion') electronAPI.python.miFuncion() │
│         │                                  │                    │
└─────────┼──────────────────────────────────┼────────────────────┘
          │                                  │
          │                         ┌────────▼────────┐
          │                         │  preload.ts      │
          │                         │  ipcRenderer     │
          │                         └────────┬────────┘
          │                                  │
          │                         ┌────────▼────────┐
          │                         │  main.ts         │
          │                         │  ipcMain.handle  │
          │                         └────────┬────────┘
          │                                  │
          │                         ┌────────▼────────┐
          │                         │  api-client.ts   │
          │                         │  HTTP al backend │
          │                         └────────┬────────┘
          │                                  │
          ▼                                  ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (NestJS - puerto 3000)          │
│                                                     │
│  python.controller.ts                               │
│    @Post('mi-funcion')                              │
│         │                                           │
│         ▼                                           │
│  python.service.ts                                  │
│    executeScript('mi_script.py', args)     ← .py    │
│    executeExecutable('mi_script.exe', args) ← .exe  │
│    executeFile('mi_script.exe', args)      ← auto   │
│         │                                           │
│         ▼                                           │
│  spawn(pythonExe, [scriptPath, ...args])   ← .py    │
│  spawn(exePath, args)                      ← .exe   │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│              PYTHON (.py o .exe)                     │
│                                                     │
│  1. Recibe JSON en sys.argv[1]                      │
│  2. Procesa datos                                   │
│  3. print("PROGRESS:50:archivo") ← progreso         │
│  4. print(json.dumps(resultado)) ← resultado final  │
└─────────────────────────────────────────────────────┘
```

---

## Ubicación de Archivos

| Entorno              | Scripts .py/.pyc              | Ejecutables .exe                                                  |
| -------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Desarrollo (Windows) | `nest-files-py-embedded/`     | `nest-files-py-embedded/` o `nest-files-py-embedded/executables/` |
| Desarrollo (Mac)     | `nest-files-py-embedded-mac/` | N/A (Mac no usa .exe)                                             |
| Producción           | `resources/python/`           | `resources/python/executables/`                                   |

---

## Ejemplo Completo: De principio a fin

Supongamos que quieres crear un .exe que procese un CSV:

### 1. Script Python (`procesar_csv.py`)

```python
import sys, json, csv, os

def procesar(datos):
    try:
        csv_path = datos.get('csv_path', '')
        print(f"PROGRESS:10:{os.path.basename(csv_path)}", flush=True)

        with open(csv_path, 'r') as f:
            reader = csv.reader(f)
            filas = list(reader)

        print(f"PROGRESS:100:{os.path.basename(csv_path)}", flush=True)
        return {"success": True, "total_filas": len(filas), "columnas": len(filas[0]) if filas else 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    datos = json.loads(sys.argv[1])
    print(json.dumps(procesar(datos)))
```

### 2. Compilar

```bash
pyinstaller --onefile procesar_csv.py
# Copiar dist/procesar_csv.exe a nest-files-py-embedded/executables/
```

### 3. Backend

```typescript
// python.service.ts
async procesarCSV(csvPath: string): Promise<any> {
  return this.executeFile('procesar_csv.exe', [JSON.stringify({ csv_path: csvPath })]);
}

// python.controller.ts
@Post('procesar-csv')
async procesarCSV(@Body() body: { csvPath: string }) {
  return this.pythonService.procesarCSV(body.csvPath);
}
```

### 4. Frontend

```typescript
const result = await firstValueFrom(
  this.http.post<any>(`${apiUrl}/python/procesar-csv`, {
    csvPath: "C:/data/archivo.csv",
  }),
);
// result = { success: true, total_filas: 150, columnas: 5 }
```

---

## Tips y Errores Comunes

1. **El .exe no se encuentra**: Verifica que esté en `nest-files-py-embedded/` o en `executables/`
2. **JSON parse error**: Tu script Python está haciendo `print()` de texto que no es JSON. Solo el último `print(json.dumps(...))` debe ser texto libre
3. **Timeout (60s)**: Si tu proceso tarda más de 60 segundos, el backend lo mata. Ajusta `TIMEOUT_MS` en `python.service.ts`
4. **Progreso no llega al frontend**: Asegúrate de usar el formato exacto `PROGRESS:{número}:{nombre}` con `flush=True`
5. **JWT 401 Unauthorized**: Todos los endpoints de Python están protegidos con `@UseGuards(JwtAuthGuard)`. Pasa el token en el header `Authorization: Bearer {token}`
