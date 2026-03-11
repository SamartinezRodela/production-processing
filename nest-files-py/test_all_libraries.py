"""
Test Master: Probar todas las bibliotecas instaladas
"""
import json
import sys

def test_imports():
    """Verificar que todas las bibliotecas se pueden importar"""
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
    
    resultados = {}
    
    for nombre, modulo in bibliotecas.items():
        try:
            mod = __import__(modulo)
            version = getattr(mod, '__version__', 'N/A')
            resultados[nombre] = {
                "instalado": True,
                "version": version,
                "modulo": modulo
            }
        except ImportError as e:
            resultados[nombre] = {
                "instalado": False,
                "error": str(e)
            }
    
    return resultados

if __name__ == "__main__":
    print(json.dumps(test_imports(), indent=2))
