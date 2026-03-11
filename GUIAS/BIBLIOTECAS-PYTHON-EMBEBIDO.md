# Guía: Bibliotecas Python en Embebido

## Resumen

Tu Python embebido puede instalar y usar:

- ✅ Paquetes pure Python (sin compilación)
- ✅ Paquetes con wheels precompilados
- ❌ Paquetes que requieren compilación (sin compilador C/C++)

## Bibliotecas Instaladas

### Procesamiento de PDFs

- `reportlab` - Crear PDFs desde cero
- `pypdf` - Leer y manipular PDFs existentes
- `pymupdf` (fitz) - Leer, editar, extraer texto/imágenes de PDFs

### Procesamiento de Imágenes

- `Pillow` (PIL) - Manipulación de imágenes (abrir, editar, guardar)
- `opencv-python-headless` (cv2) - Visión por computadora (sin GUI)
- `tifffile` - Leer/escribir archivos TIFF

> **Nota**: Usamos `opencv-python-headless` en lugar de `opencv-python` porque:
>
> - Es más ligero (~30 MB vs ~90 MB)
> - No incluye dependencias de GUI (Qt, GTK)
> - Ideal para aplicaciones embebidas sin interfaz gráfica
> - Incluye todas las funciones de procesamiento de imágenes

### Análisis de Datos

- `numpy` - Arrays y operaciones matemáticas
- `pandas` - DataFrames y análisis de datos
- `scipy` - Funciones científicas avanzadas
- `matplotlib` - Gráficos y visualizaciones

### Utilidades

- `openpyxl` - Leer/escribir archivos Excel
- `requests` - Peticiones HTTP

## Cómo Funciona

### Windows (Python 3.13)

```powershell
# 1. Descarga Python embebido
Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.13.0/python-3.13.0-embed-amd64.zip"

# 2. Habilita pip editando python313._pth
# Descomentar: import site

# 3. Instala pip
.\python.exe get-pip.py

# 4. Instala paquetes
.\python.exe -m pip install numpy pandas matplotlib
```

### Mac (Python 3.11 ARM64)

```bash
# 1. Descarga Python standalone (indygreg)
curl -L -o python.tar.gz "https://github.com/indygreg/python-build-standalone/..."

# 2. Extrae
tar -xzf python.tar.gz

# 3. Instala paquetes
python-runtime/bin/pip3 install numpy pandas matplotlib
```

## Ubicación Final

### Windows

```
nest-electron/release/win-unpacked/resources/python/
├── python.exe
├── python313.dll
├── Lib/
│   └── site-packages/
│       ├── numpy/
│       ├── pandas/
│       ├── PIL/
│       └── ...
└── *.pyc (tus scripts compilados)
```

### Mac

```
Production Processing.app/Contents/Resources/python/
├── python-runtime/
│   ├── bin/
│   │   ├── python3
│   │   └── pip3
│   └── lib/
│       └── python3.11/
│           └── site-packages/
│               ├── numpy/
│               ├── pandas/
│               └── ...
└── *.pyc (tus scripts compilados)
```

## Ejemplo de Uso

### Script Python (nest-files-py/procesar_datos.py)

```python
import json
import numpy as np
import pandas as pd
from PIL import Image
import cv2

def procesar_datos(datos_json):
    # Usar pandas
    df = pd.DataFrame(datos_json)

    # Usar numpy
    promedio = np.mean(df['valores'])

    return {
        "promedio": float(promedio),
        "total": len(df)
    }

def procesar_imagen(ruta_imagen):
    # Usar PIL
    img = Image.open(ruta_imagen)

    # Usar OpenCV
    img_cv = cv2.imread(ruta_imagen)

    return {
        "tamaño": img.size,
        "formato": img.format
    }

if __name__ == "__main__":
    import sys
    resultado = procesar_datos([{"valores": [1, 2, 3]}])
    print(json.dumps(resultado))
```

### Desde NestJS Backend

```typescript
// nest-ui-be/src/python/python.service.ts
async procesarDatos(datos: any) {
  const resultado = await this.executePythonScript(
    'procesar_datos.py',
    [JSON.stringify(datos)]
  );
  return JSON.parse(resultado);
}
```

## Consideraciones Importantes

### Compatibilidad de Versiones

- **Windows**: Python 3.13 (algunos paquetes pueden no tener wheels aún)
- **Mac**: Python 3.11 (mejor compatibilidad con wheels ARM64)

### Tamaño del Instalador

Cada biblioteca añade peso:

- `numpy`: ~15 MB
- `pandas`: ~30 MB
- `matplotlib`: ~40 MB
- `opencv-python-headless`: ~30 MB (versión sin GUI, más ligera)
- `scipy`: ~50 MB

**Total aproximado**: +165 MB con todas las bibliotecas (usando opencv-python-headless)

### Solución de Problemas

#### Error: "No module named 'xxx'"

```powershell
# Verificar instalación
.\python.exe -m pip list

# Reinstalar
.\python.exe -m pip install --force-reinstall xxx
```

#### Error: "DLL load failed"

- Asegúrate de copiar todas las DLLs necesarias
- En Windows, verifica que `python313.dll` esté presente

#### Error: "Bad magic number in .pyc"

- Los .pyc deben compilarse con la misma versión de Python
- Recompila con el Python embebido correcto

## Instalación Selectiva

Si no necesitas todas las bibliotecas, puedes instalar solo las que uses:

### Mínimo (PDFs básicos)

```powershell
.\python.exe -m pip install reportlab pypdf
```

### Procesamiento de Imágenes

```powershell
.\python.exe -m pip install Pillow opencv-python-headless
```

### Análisis de Datos

```powershell
.\python.exe -m pip install numpy pandas
```

### Completo (todas)

```powershell
.\python.exe -m pip install reportlab pypdf Pillow openpyxl requests numpy pandas scipy matplotlib opencv-python-headless pymupdf tifffile
```

## Verificar Instalación

Crea un script de prueba:

```python
# test_bibliotecas.py
import sys
import json

bibliotecas = [
    'numpy', 'pandas', 'PIL', 'cv2', 'scipy',
    'matplotlib', 'fitz', 'tifffile', 'reportlab', 'pypdf'
]

resultados = {}
for lib in bibliotecas:
    try:
        mod = __import__(lib)
        version = getattr(mod, '__version__', 'N/A')
        resultados[lib] = {"instalado": True, "version": version}
    except ImportError:
        resultados[lib] = {"instalado": False}

print(json.dumps(resultados, indent=2))
```

Ejecuta:

```powershell
.\python.exe test_bibliotecas.py
```

## Próximos Pasos

1. ✅ Workflows actualizados para instalar todas las bibliotecas
2. ✅ Ejemplo de uso creado (`ejemplo_bibliotecas.py`)
3. 🔄 Haz push a GitHub para que Actions compile con las nuevas bibliotecas
4. 🔄 Descarga el instalador y prueba las bibliotecas

## Referencias

- [Python Embebido Windows](https://www.python.org/downloads/windows/)
- [Python Standalone (indygreg)](https://github.com/indygreg/python-build-standalone)
- [PyPI - Python Package Index](https://pypi.org/)
