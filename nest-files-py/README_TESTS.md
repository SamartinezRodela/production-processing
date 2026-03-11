# Tests de Bibliotecas Python

Scripts de prueba para cada biblioteca instalada en el Python embebido.

## Estructura de Archivos

```
nest-files-py/
├── test_all_libraries.py    # Verificar imports de todas las bibliotecas
├── test_reportlab.py         # Crear PDFs con ReportLab
├── test_pypdf.py             # Leer PDFs con PyPDF
├── test_pymupdf.py           # Analizar PDFs con PyMuPDF
├── test_numpy_pandas.py      # Análisis de datos
├── test_matplotlib.py        # Gráficos
├── test_opencv.py            # Visión por computadora
├── test_pillow.py            # Manipulación de imágenes
├── test_scipy.py             # Funciones científicas
└── run_tests.ps1             # Ejecutar todas las pruebas
```

## Ejecutar Todas las Pruebas

### Windows (PowerShell)

```powershell
cd nest-files-py
.\run_tests.ps1
```

### Manualmente (una por una)

```powershell
# Verificar imports
python test_all_libraries.py

# NumPy
python test_numpy_pandas.py

# Pandas
python test_numpy_pandas.py pandas

# ReportLab
python test_reportlab.py output/test.pdf

# Matplotlib
python test_matplotlib.py lineas output/grafico.png

# OpenCV
python test_opencv.py output/opencv.png

# Pillow
python test_pillow.py output/pillow.png

# SciPy
python test_scipy.py

# PyPDF (necesita un PDF existente)
python test_pypdf.py ruta/al/archivo.pdf

# PyMuPDF (necesita un PDF existente)
python test_pymupdf.py ruta/al/archivo.pdf
```

## Pruebas Individuales

### 1. test_all_libraries.py

Verifica que todas las bibliotecas se puedan importar.

**Salida**: JSON con estado de cada biblioteca

```json
{
  "numpy": {
    "instalado": true,
    "version": "1.26.0"
  },
  ...
}
```

### 2. test_reportlab.py

Crea un PDF de prueba con ReportLab.

**Uso**:

```bash
python test_reportlab.py [ruta_salida.pdf]
```

**Salida**: PDF con texto, formas y líneas

### 3. test_numpy_pandas.py

Prueba operaciones con NumPy y Pandas.

**Uso**:

```bash
python test_numpy_pandas.py          # NumPy
python test_numpy_pandas.py pandas   # Pandas
python test_numpy_pandas.py combinado # Ambos
```

**Salida**: JSON con resultados de operaciones

### 4. test_matplotlib.py

Crea gráficos con Matplotlib.

**Uso**:

```bash
python test_matplotlib.py lineas [salida.png]
python test_matplotlib.py barras [salida.png]
python test_matplotlib.py dispersion [salida.png]
python test_matplotlib.py pastel [salida.png]
```

**Salida**: Imagen PNG con el gráfico

### 5. test_opencv.py

Crea y procesa imágenes con OpenCV.

**Uso**:

```bash
python test_opencv.py [salida.png]
```

**Salida**: Imagen PNG con formas dibujadas

### 6. test_pillow.py

Manipula imágenes con Pillow.

**Uso**:

```bash
python test_pillow.py [salida.png]
```

**Salida**: Imagen PNG con formas y texto

### 7. test_scipy.py

Prueba funciones estadísticas de SciPy.

**Uso**:

```bash
python test_scipy.py
```

**Salida**: JSON con estadísticas

### 8. test_pypdf.py

Lee información de PDFs con PyPDF.

**Uso**:

```bash
python test_pypdf.py ruta/al/archivo.pdf
```

**Salida**: JSON con metadata y texto

### 9. test_pymupdf.py

Analiza PDFs con PyMuPDF.

**Uso**:

```bash
python test_pymupdf.py ruta/al/archivo.pdf
```

**Salida**: JSON con información detallada del PDF

## Probar con Python Embebido

Si ya compilaste la aplicación, puedes probar con el Python embebido:

### Windows

```powershell
cd nest-electron\release\win-unpacked\resources\python
.\python.exe ..\..\..\..\..\..\nest-files-py\test_all_libraries.py
```

### Mac

```bash
cd "nest-electron/release/Production Processing-darwin-arm64/Production Processing.app/Contents/Resources/python"
./python-runtime/bin/python3 ../../../../../../../nest-files-py/test_all_libraries.py
```

## Integración con Backend

Estos scripts están diseñados para ser llamados desde el backend NestJS.

Ver: `nest-ui-be/src/python/python.service.ts`

## Solución de Problemas

### Error: "No module named 'xxx'"

La biblioteca no está instalada. Verifica con:

```bash
python -m pip list
```

### Error: "Bad magic number"

Los archivos .pyc fueron compilados con una versión diferente de Python.
Solución: Recompila los scripts con el Python embebido correcto.

### Error: "DLL load failed"

Falta una DLL necesaria. Asegúrate de que todas las DLLs de Python estén presentes.

## Archivos de Salida

Los tests crean archivos en `nest-files-py/output/`:

- PDFs generados
- Imágenes procesadas
- Gráficos

Asegúrate de que la carpeta `output` exista o créala:

```powershell
mkdir output
```
