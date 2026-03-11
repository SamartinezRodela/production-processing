# Comandos de Instalación - Bibliotecas Python

## Instalación Individual

```bash
# Procesamiento de PDFs
pip install reportlab
pip install pypdf
pip install pymupdf

# Procesamiento de Imágenes
pip install Pillow
pip install opencv-python-headless
pip install tifffile

# Análisis de Datos
pip install numpy
pip install pandas
pip install scipy
pip install matplotlib

# Utilidades
pip install openpyxl
pip install requests
```

## Instalación en Bloque (Recomendado)

### Todas las bibliotecas

```bash
pip install reportlab pypdf pymupdf Pillow opencv-python-headless tifffile numpy pandas scipy matplotlib openpyxl requests
```

### Solo PDFs

```bash
pip install reportlab pypdf pymupdf
```

### Solo Imágenes

```bash
pip install Pillow opencv-python-headless tifffile
```

### Solo Análisis de Datos

```bash
pip install numpy pandas scipy matplotlib
```

## Para Python Embebido Windows

```powershell
# Navegar a la carpeta del Python embebido
cd nest-files-py-embedded

# Instalar todas las bibliotecas
.\python.exe -m pip install reportlab pypdf pymupdf Pillow opencv-python-headless tifffile numpy pandas scipy matplotlib openpyxl requests --no-warn-script-location
```

## Para Python Embebido Mac

```bash
# Navegar a la carpeta del Python embebido
cd nest-files-py-embedded-mac

# Instalar todas las bibliotecas
python-runtime/bin/pip3 install reportlab pypdf pymupdf Pillow opencv-python-headless tifffile numpy pandas scipy matplotlib openpyxl requests
```

## Verificar Instalación

```python
# test_instalacion.py
import sys

bibliotecas = {
    'reportlab': 'reportlab',
    'pypdf': 'pypdf',
    'pymupdf': 'fitz',
    'Pillow': 'PIL',
    'opencv-python-headless': 'cv2',
    'tifffile': 'tifffile',
    'numpy': 'numpy',
    'pandas': 'pandas',
    'scipy': 'scipy',
    'matplotlib': 'matplotlib',
    'openpyxl': 'openpyxl',
    'requests': 'requests'
}

print("Verificando instalación de bibliotecas:\n")
for nombre, modulo in bibliotecas.items():
    try:
        mod = __import__(modulo)
        version = getattr(mod, '__version__', 'N/A')
        print(f"✅ {nombre:25} -> {modulo:15} v{version}")
    except ImportError as e:
        print(f"❌ {nombre:25} -> {modulo:15} NO INSTALADO")

print("\n✅ Verificación completada")
```

Ejecutar:

```bash
python test_instalacion.py
```

## Notas Importantes

1. **opencv-python-headless vs opencv-python**:
   - `opencv-python-headless`: Sin GUI, más ligero (~30 MB)
   - `opencv-python`: Con GUI, más pesado (~90 MB)
   - Para aplicaciones embebidas, usa `headless`

2. **Compatibilidad de versiones**:
   - Windows: Python 3.13 (algunos paquetes pueden no tener wheels)
   - Mac: Python 3.11 (mejor compatibilidad)

3. **Tamaño total aproximado**: ~165 MB con todas las bibliotecas

4. **Importación en código**:
   ```python
   import numpy as np
   import pandas as pd
   from PIL import Image
   import cv2
   import fitz  # pymupdf
   import tifffile
   from reportlab.pdfgen import canvas
   from pypdf import PdfReader
   ```
