"""
Quick Test: Prueba rápida de todas las bibliotecas
Ejecuta: python quick_test.py
Retorna: JSON con el estado de cada biblioteca
"""
import sys
import json

def test_biblioteca(nombre, modulo, test_func=None):
    """Probar una biblioteca y retornar resultado"""
    try:
        mod = __import__(modulo)
        version = getattr(mod, '__version__', 'N/A')
        
        test_passed = True
        test_error = None
        
        if test_func:
            try:
                test_func(mod)
            except Exception as e:
                test_passed = False
                test_error = str(e)
        
        return {
            'instalado': True,
            'version': version,
            'test_passed': test_passed,
            'test_error': test_error
        }
    except ImportError as e:
        return {
            'instalado': False,
            'version': None,
            'test_passed': False,
            'test_error': str(e)
        }

def test_numpy(mod):
    """Test rápido de NumPy"""
    arr = mod.array([1, 2, 3])
    assert mod.sum(arr) == 6

def test_pandas(mod):
    """Test rápido de Pandas"""
    df = mod.DataFrame({'A': [1, 2, 3]})
    assert len(df) == 3

def test_matplotlib(mod):
    """Test rápido de Matplotlib"""
    mod.use('Agg')
    import matplotlib.pyplot as plt
    plt.plot([1, 2, 3])
    plt.close()

def test_opencv(mod):
    """Test rápido de OpenCV"""
    import numpy as np
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    mod.rectangle(img, (10, 10), (90, 90), (255, 0, 0), 2)

def test_pillow(mod):
    """Test rápido de Pillow"""
    from PIL import Image
    img = Image.new('RGB', (100, 100))
    assert img.size == (100, 100)

# Definir bibliotecas a probar
bibliotecas = [
    ('reportlab', 'reportlab', None),
    ('pypdf', 'pypdf', None),
    ('pymupdf', 'fitz', None),
    ('Pillow', 'PIL', test_pillow),
    ('opencv-python-headless', 'cv2', test_opencv),
    ('tifffile', 'tifffile', None),
    ('numpy', 'numpy', test_numpy),
    ('pandas', 'pandas', test_pandas),
    ('scipy', 'scipy', None),
    ('matplotlib', 'matplotlib', test_matplotlib),
    ('openpyxl', 'openpyxl', None),
    ('requests', 'requests', None)
]

# Ejecutar pruebas
resultados = {}
for nombre, modulo, test in bibliotecas:
    resultados[nombre] = test_biblioteca(nombre, modulo, test)

# Retornar JSON
print(json.dumps(resultados, ensure_ascii=False, indent=2))
