"""
Ejemplo de uso de las bibliotecas instaladas en Python embebido
"""

import sys
import json

def ejemplo_numpy_pandas():
    """Ejemplo con NumPy y Pandas"""
    import numpy as np
    import pandas as pd
    
    # Crear array con NumPy
    datos = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    
    # Crear DataFrame con Pandas
    df = pd.DataFrame(datos, columns=['A', 'B', 'C'])
    
    return {
        "promedio": float(df.mean().mean()),
        "suma_total": int(df.sum().sum()),
        "shape": df.shape
    }

def ejemplo_pillow():
    """Ejemplo con Pillow (PIL)"""
    from PIL import Image, ImageDraw, ImageFont
    import io
    import base64
    
    # Crear imagen
    img = Image.new('RGB', (200, 100), color='white')
    draw = ImageDraw.Draw(img)
    draw.text((10, 40), "Hola desde PIL", fill='black')
    
    # Convertir a base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {"imagen_base64": img_base64}

def ejemplo_opencv():
    """Ejemplo con OpenCV (headless - sin GUI)"""
    import cv2
    import numpy as np
    
    # Crear imagen simple
    img = np.zeros((100, 200, 3), dtype=np.uint8)
    cv2.rectangle(img, (10, 10), (190, 90), (0, 255, 0), 2)
    cv2.putText(img, 'OpenCV', (50, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    
    return {
        "opencv_version": cv2.__version__,
        "build_info": "headless (sin GUI)"
    }

def ejemplo_pymupdf(pdf_path):
    """Ejemplo con PyMuPDF para leer PDFs"""
    import fitz  # PyMuPDF
    
    try:
        doc = fitz.open(pdf_path)
        info = {
            "paginas": len(doc),
            "metadata": doc.metadata,
            "texto_primera_pagina": doc[0].get_text()[:200] if len(doc) > 0 else ""
        }
        doc.close()
        return info
    except Exception as e:
        return {"error": str(e)}

def ejemplo_matplotlib():
    """Ejemplo con Matplotlib"""
    import matplotlib
    matplotlib.use('Agg')  # Backend sin GUI
    import matplotlib.pyplot as plt
    import io
    import base64
    
    # Crear gráfico simple
    fig, ax = plt.subplots()
    ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
    ax.set_title('Gráfico de ejemplo')
    
    # Guardar a base64
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return {"grafico_base64": img_base64}

def ejemplo_scipy():
    """Ejemplo con SciPy"""
    from scipy import stats
    import numpy as np
    
    # Generar datos
    datos = np.random.normal(100, 15, 100)
    
    # Calcular estadísticas
    return {
        "media": float(np.mean(datos)),
        "desviacion": float(np.std(datos)),
        "mediana": float(np.median(datos))
    }

def ejemplo_tifffile(tiff_path=None):
    """Ejemplo con tifffile"""
    import tifffile
    import numpy as np
    
    if tiff_path:
        try:
            img = tifffile.imread(tiff_path)
            return {
                "shape": img.shape,
                "dtype": str(img.dtype)
            }
        except Exception as e:
            return {"error": str(e)}
    else:
        # Crear TIFF de ejemplo
        data = np.random.randint(0, 255, (100, 100), dtype=np.uint8)
        return {"ejemplo": "TIFF creado en memoria", "shape": data.shape}

def main():
    """Función principal para probar todas las bibliotecas"""
    resultados = {}
    
    try:
        resultados["numpy_pandas"] = ejemplo_numpy_pandas()
    except Exception as e:
        resultados["numpy_pandas"] = {"error": str(e)}
    
    try:
        resultados["pillow"] = ejemplo_pillow()
    except Exception as e:
        resultados["pillow"] = {"error": str(e)}
    
    try:
        resultados["opencv"] = ejemplo_opencv()
    except Exception as e:
        resultados["opencv"] = {"error": str(e)}
    
    try:
        resultados["matplotlib"] = ejemplo_matplotlib()
    except Exception as e:
        resultados["matplotlib"] = {"error": str(e)}
    
    try:
        resultados["scipy"] = ejemplo_scipy()
    except Exception as e:
        resultados["scipy"] = {"error": str(e)}
    
    try:
        resultados["tifffile"] = ejemplo_tifffile()
    except Exception as e:
        resultados["tifffile"] = {"error": str(e)}
    
    print(json.dumps(resultados, indent=2))

if __name__ == "__main__":
    main()
