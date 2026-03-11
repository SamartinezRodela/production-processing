# Instrucciones: Probar Bibliotecas Python

## 🚀 Prueba Rápida (Recomendado)

### Opción 1: Test Rápido (30 segundos)

```powershell
cd c:\Projects\NEST-UI-V2\nest-files-py
python quick_test.py
```

Esto verificará que todas las bibliotecas estén instaladas y funcionando.

### Opción 2: Test Completo (2 minutos)

```powershell
cd c:\Projects\NEST-UI-V2\nest-files-py
.\run_tests.ps1
```

Esto ejecutará todas las pruebas y generará archivos de salida.

## 📋 Pruebas Individuales

### 1. Verificar Imports

```powershell
cd c:\Projects\NEST-UI-V2\nest-files-py
python test_all_libraries.py
```

**Salida**: JSON con estado de cada biblioteca

### 2. NumPy y Pandas

```powershell
# NumPy
python test_numpy_pandas.py

# Pandas
python test_numpy_pandas.py pandas

# Combinado
python test_numpy_pandas.py combinado
```

**Salida**: JSON con operaciones matemáticas y análisis de datos

### 3. Crear PDFs con ReportLab

```powershell
mkdir output -ErrorAction SilentlyContinue
python test_reportlab.py output/mi_pdf.pdf
```

**Salida**: PDF en `output/mi_pdf.pdf`

### 4. Gráficos con Matplotlib

```powershell
# Gráfico de líneas
python test_matplotlib.py lineas output/lineas.png

# Gráfico de barras
python test_matplotlib.py barras output/barras.png

# Gráfico de dispersión
python test_matplotlib.py dispersion output/dispersion.png

# Gráfico de pastel
python test_matplotlib.py pastel output/pastel.png
```

**Salida**: Imágenes PNG en `output/`

### 5. OpenCV (Visión por Computadora)

```powershell
python test_opencv.py output/opencv.png
```

**Salida**: Imagen PNG con formas dibujadas

### 6. Pillow (Manipulación de Imágenes)

```powershell
python test_pillow.py output/pillow.png
```

**Salida**: Imagen PNG con formas y texto

### 7. SciPy (Funciones Científicas)

```powershell
python test_scipy.py
```

**Salida**: JSON con estadísticas

### 8. PyPDF (Leer PDFs)

```powershell
# Primero crea un PDF con ReportLab
python test_reportlab.py output/test.pdf

# Luego léelo con PyPDF
python test_pypdf.py output/test.pdf
```

**Salida**: JSON con metadata del PDF

### 9. PyMuPDF (Analizar PDFs)

```powershell
# Usa el PDF creado anteriormente
python test_pymupdf.py output/test.pdf
```

**Salida**: JSON con información detallada del PDF

## 📁 Estructura de Archivos

```
nest-files-py/
├── quick_test.py            ⭐ Prueba rápida (EMPIEZA AQUÍ)
├── run_tests.ps1            ⭐ Ejecutar todas las pruebas
├── test_all_libraries.py    - Verificar imports
├── test_reportlab.py        - Crear PDFs
├── test_pypdf.py            - Leer PDFs
├── test_pymupdf.py          - Analizar PDFs
├── test_numpy_pandas.py     - Análisis de datos
├── test_matplotlib.py       - Gráficos
├── test_opencv.py           - Visión por computadora
├── test_pillow.py           - Manipulación de imágenes
├── test_scipy.py            - Funciones científicas
├── README_TESTS.md          - Documentación completa
└── output/                  - Archivos generados (crear si no existe)
```

## 🔧 Solución de Problemas

### Error: "python no se reconoce como comando"

Instala Python o usa el Python embebido:

```powershell
..\nest-files-py-embedded\python.exe quick_test.py
```

### Error: "No module named 'xxx'"

La biblioteca no está instalada. Instálala:

```powershell
python -m pip install xxx
```

O espera a que GitHub Actions compile con las bibliotecas.

### Error: "No such file or directory: 'output'"

Crea la carpeta:

```powershell
mkdir output
```

### Error: "Bad magic number in .pyc"

Los archivos .pyc fueron compilados con otra versión de Python.
Usa el mismo Python que compiló los .pyc.

## 📊 Salida Esperada

### quick_test.py

```
============================================================
  PRUEBA RÁPIDA DE BIBLIOTECAS PYTHON
============================================================

✅ reportlab                 v4.0.7
✅ pypdf                     v3.17.1
✅ pymupdf                   v1.23.8
✅ Pillow                    v10.1.0 [TEST OK]
✅ opencv-python-headless    v4.8.1 [TEST OK]
✅ tifffile                  v2023.12.9
✅ numpy                     v1.26.2 [TEST OK]
✅ pandas                    v2.1.4 [TEST OK]
✅ scipy                     v1.11.4
✅ matplotlib                v3.8.2 [TEST OK]
✅ openpyxl                  v3.1.2
✅ requests                  v2.31.0

============================================================
  RESULTADO: 12/12 bibliotecas instaladas
============================================================
✅ Todas las bibliotecas están instaladas y funcionando!
```

## 🎯 Próximos Pasos

1. ✅ Ejecuta `quick_test.py` para verificar instalación
2. ✅ Ejecuta `run_tests.ps1` para generar archivos de prueba
3. ✅ Revisa los archivos en `output/`
4. 🔄 Haz push a GitHub para compilar con las bibliotecas
5. 🔄 Descarga el instalador y prueba en producción

## 📚 Documentación Adicional

- `README_TESTS.md` - Documentación completa de cada test
- `GUIAS/BIBLIOTECAS-PYTHON-EMBEBIDO.md` - Guía del Python embebido
- `COMANDOS-INSTALACION-BIBLIOTECAS.md` - Comandos de instalación

## 💡 Consejos

- Usa `quick_test.py` para verificación rápida
- Usa `run_tests.ps1` para pruebas completas
- Los archivos de salida se guardan en `output/`
- Todos los scripts devuelven JSON para fácil integración con el backend
