"""
Dispatcher: Punto de entrada único para todos los scripts del Grupo B.
Se compila a un solo .exe con PyInstaller, incluyendo todas las bibliotecas.

Uso: dispatcher.exe <comando> [args...]

Comandos disponibles:
  generar_pdf <json_datos>
  generar_pdf_path <json_datos>
  verify_folder <folder_path>
  generate_pdf <temp_file_path>
  test_imports
  test_all_libraries
  test_numpy_pandas [pandas|combinado]
  test_reportlab <output_path>
  test_matplotlib <tipo> <output_path>
  test_opencv <output_path>
  test_pillow <output_path>
  test_scipy
  test_pypdf <pdf_path>
  test_pymupdf <pdf_path>
  quick_test
  ejemplo_bibliotecas
"""
import sys
import json


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Se requiere un comando. Uso: dispatcher <comando> [args...]",
            "comandos": [
                "generar_pdf", "generar_pdf_path", "verify_folder", "generate_pdf",
                "test_imports", "test_all_libraries", "test_numpy_pandas",
                "test_reportlab", "test_matplotlib", "test_opencv", "test_pillow",
                "test_scipy", "test_pypdf", "test_pymupdf", "quick_test",
                "ejemplo_bibliotecas"
            ]
        }))
        sys.exit(1)

    comando = sys.argv[1]
    args = sys.argv[2:]

    try:
        resultado = ejecutar_comando(comando, args)
        print(json.dumps(resultado, indent=2, ensure_ascii=False))
        sys.exit(0 if resultado.get("success", True) else 1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


def ejecutar_comando(comando, args):
    """Enruta el comando al módulo correspondiente."""

    # ── Generación de PDFs ──
    if comando == "generar_pdf":
        return cmd_generar_pdf(args)
    elif comando == "generar_pdf_path":
        return cmd_generar_pdf_path(args)
    elif comando == "verify_folder":
        return cmd_verify_folder(args)
    elif comando == "generate_pdf":
        return cmd_generate_pdf(args)

    # ── Tests de bibliotecas ──
    elif comando == "test_imports":
        return cmd_test_imports()
    elif comando == "test_all_libraries":
        return cmd_test_all_libraries()
    elif comando == "test_numpy_pandas":
        return cmd_test_numpy_pandas(args)
    elif comando == "test_reportlab":
        return cmd_test_reportlab(args)
    elif comando == "test_matplotlib":
        return cmd_test_matplotlib(args)
    elif comando == "test_opencv":
        return cmd_test_opencv(args)
    elif comando == "test_pillow":
        return cmd_test_pillow(args)
    elif comando == "test_scipy":
        return cmd_test_scipy()
    elif comando == "test_pypdf":
        return cmd_test_pypdf(args)
    elif comando == "test_pymupdf":
        return cmd_test_pymupdf(args)
    elif comando == "quick_test":
        return cmd_quick_test()
    elif comando == "ejemplo_bibliotecas":
        return cmd_ejemplo_bibliotecas()
    else:
        return {"success": False, "error": f"Comando desconocido: {comando}"}


# ═══════════════════════════════════════════
# COMANDOS DE GENERACIÓN DE PDF
# ═══════════════════════════════════════════

def cmd_generar_pdf(args):
    """Genera un PDF con reportlab (datos JSON como argumento)."""
    from datetime import datetime
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import inch
    import os

    if not args:
        return {"success": False, "error": "Se requiere JSON con datos del PDF"}

    datos = json.loads(args[0])
    titulo = datos.get('titulo', 'Documento Sin Título')
    contenido = datos.get('contenido', '')
    autor = datos.get('autor', 'Anónimo')
    nombre_archivo = datos.get('nombre_archivo', 'documento.pdf')

    if not nombre_archivo.endswith('.pdf'):
        nombre_archivo += '.pdf'

    c = canvas.Canvas(nombre_archivo, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 24)
    c.drawString(1*inch, height - 1*inch, titulo)
    c.setFont("Helvetica", 10)
    c.drawString(1*inch, height - 1.3*inch, f"Autor: {autor}")
    c.drawString(1*inch, height - 1.5*inch, f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    c.line(1*inch, height - 1.7*inch, width - 1*inch, height - 1.7*inch)

    c.setFont("Helvetica", 12)
    y_position = height - 2.2*inch
    max_width = width - 2*inch

    for linea in contenido.split('\n'):
        if y_position < 1*inch:
            c.showPage()
            y_position = height - 1*inch
            c.setFont("Helvetica", 12)
        palabras = linea.split(' ')
        linea_actual = ''
        for palabra in palabras:
            test_linea = linea_actual + palabra + ' '
            if c.stringWidth(test_linea, "Helvetica", 12) < max_width:
                linea_actual = test_linea
            else:
                if linea_actual:
                    c.drawString(1*inch, y_position, linea_actual.strip())
                    y_position -= 0.2*inch
                linea_actual = palabra + ' '
        if linea_actual:
            c.drawString(1*inch, y_position, linea_actual.strip())
            y_position -= 0.2*inch

    c.save()
    return {
        "success": True,
        "mensaje": f"PDF generado exitosamente: {nombre_archivo}",
        "archivo": nombre_archivo,
        "ruta": os.path.abspath(nombre_archivo),
        "timestamp": datetime.now().isoformat()
    }


def cmd_generar_pdf_path(args):
    """Genera un PDF con ruta dinámica (reportlab)."""
    from datetime import datetime
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import inch
    import os

    if not args:
        return {"success": False, "error": "Se requiere JSON con datos del PDF"}

    datos = json.loads(args[0])
    titulo = datos.get('titulo', 'Documento sin titulo')
    contenido = datos.get('contenido', '')
    autor = datos.get('autor', 'Anonimo')
    nombre_archivo = datos.get('nombre_archivo', 'documento.pdf')
    ruta_salida = datos.get('ruta_salida', None)

    if not nombre_archivo.endswith('.pdf'):
        nombre_archivo += '.pdf'

    if ruta_salida:
        os.makedirs(ruta_salida, exist_ok=True)
        ruta_completa = os.path.join(ruta_salida, nombre_archivo)
    else:
        ruta_completa = nombre_archivo

    c = canvas.Canvas(ruta_completa, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 24)
    c.drawString(1*inch, height - 1*inch, titulo)
    c.setFont("Helvetica", 10)
    c.drawString(1*inch, height - 1.3*inch, f"Autor: {autor}")
    c.drawString(1*inch, height - 1.5*inch, f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    c.line(1*inch, height - 1.7*inch, width - 1*inch, height - 1.7*inch)

    c.setFont("Helvetica", 12)
    y_position = height - 2.2*inch
    max_width = width - 2*inch

    for linea in contenido.split('\n'):
        if y_position < 1*inch:
            c.showPage()
            y_position = height - 1*inch
            c.setFont("Helvetica", 12)
        palabras = linea.split(' ')
        linea_actual = ''
        for palabra in palabras:
            test_linea = linea_actual + palabra + ' '
            if c.stringWidth(test_linea, "Helvetica", 12) < max_width:
                linea_actual = test_linea
            else:
                if linea_actual:
                    c.drawString(1*inch, y_position, linea_actual.strip())
                    y_position -= 0.2*inch
                linea_actual = palabra + ' '
        if linea_actual:
            c.drawString(1*inch, y_position, linea_actual.strip())
            y_position -= 0.2*inch

    c.save()
    return {
        "success": True,
        "mensaje": f"PDF generado exitosamente: {nombre_archivo}",
        "archivo": nombre_archivo,
        "ruta": os.path.abspath(ruta_completa),
        "timestamp": datetime.now().isoformat()
    }


def cmd_verify_folder(args):
    """Verifica una carpeta de archivos."""
    import os

    if not args:
        return {"success": False, "error": "Se requiere la ruta de la carpeta"}

    folder_path = args[0]
    if not os.path.exists(folder_path):
        return {"success": False, "error": f"Carpeta no encontrada: {folder_path}"}

    files = []
    for f in os.listdir(folder_path):
        full_path = os.path.join(folder_path, f)
        if os.path.isfile(full_path):
            files.append({
                "name": f,
                "size": os.path.getsize(full_path),
                "path": full_path
            })

    return {
        "success": True,
        "folder": folder_path,
        "file_count": len(files),
        "files": files
    }


def cmd_generate_pdf(args):
    """Genera PDFs desde archivo temporal JSON (usado por pdf.service.ts)."""
    from datetime import datetime
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import inch
    import os

    if not args:
        return {"success": False, "error": "Se requiere la ruta del archivo temporal JSON"}

    temp_file = args[0]
    with open(temp_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    pdf_type = data.get('type', 'default')
    names = data.get('names', [])
    facility = data.get('facility', '')
    process_type = data.get('processType', '')
    files = data.get('files', [])

    generated = []
    for name in names:
        filename = f"{name}.pdf"
        c = canvas.Canvas(filename, pagesize=letter)
        width, height = letter

        c.setFont("Helvetica-Bold", 18)
        c.drawString(1*inch, height - 1*inch, f"Document: {name}")
        c.setFont("Helvetica", 12)
        c.drawString(1*inch, height - 1.4*inch, f"Facility: {facility}")
        c.drawString(1*inch, height - 1.6*inch, f"Process: {process_type}")
        c.drawString(1*inch, height - 1.8*inch, f"Type: {pdf_type}")
        c.drawString(1*inch, height - 2.0*inch, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        c.save()

        generated.append({
            "name": name,
            "file": filename,
            "path": os.path.abspath(filename)
        })

    return {
        "success": True,
        "generated": generated,
        "count": len(generated)
    }


# ═══════════════════════════════════════════
# COMANDOS DE TEST
# ═══════════════════════════════════════════

def cmd_test_imports():
    """Verifica que todas las dependencias estén instaladas."""
    results = {
        "python_version": sys.version,
        "python_executable": sys.executable,
        "imports": {}
    }

    libs = [
        ("reportlab", "reportlab"),
        ("reportlab.pdfgen", "reportlab.pdfgen.canvas"),
        ("reportlab.lib", "reportlab.lib.pagesizes"),
        ("pypdf", "pypdf"),
        ("pymupdf", "fitz"),
        ("Pillow", "PIL"),
        ("opencv", "cv2"),
        ("numpy", "numpy"),
        ("pandas", "pandas"),
        ("scipy", "scipy"),
        ("matplotlib", "matplotlib"),
        ("openpyxl", "openpyxl"),
        ("tifffile", "tifffile"),
        ("requests", "requests"),
    ]

    for name, module in libs:
        try:
            mod = __import__(module)
            version = getattr(mod, '__version__', getattr(mod, 'Version', 'N/A'))
            results["imports"][name] = {"installed": True, "version": str(version)}
        except ImportError as e:
            results["imports"][name] = {"installed": False, "error": str(e)}

    results["success"] = True
    return results


def cmd_test_all_libraries():
    """Verifica que todas las bibliotecas se pueden importar."""
    bibliotecas = {
        'reportlab': 'reportlab', 'pypdf': 'pypdf', 'pymupdf': 'fitz',
        'Pillow': 'PIL', 'opencv-python-headless': 'cv2', 'tifffile': 'tifffile',
        'numpy': 'numpy', 'pandas': 'pandas', 'scipy': 'scipy',
        'matplotlib': 'matplotlib', 'openpyxl': 'openpyxl', 'requests': 'requests'
    }
    resultados = {}
    for nombre, modulo in bibliotecas.items():
        try:
            mod = __import__(modulo)
            version = getattr(mod, '__version__', 'N/A')
            resultados[nombre] = {"instalado": True, "version": version, "modulo": modulo}
        except ImportError as e:
            resultados[nombre] = {"instalado": False, "error": str(e)}
    return resultados


def cmd_test_numpy_pandas(args):
    """Prueba NumPy y/o Pandas."""
    import numpy as np
    import pandas as pd

    modo = args[0] if args else "numpy"

    if modo == "pandas":
        data = {
            'Nombre': ['Ana', 'Juan', 'María', 'Pedro', 'Lucía'],
            'Edad': [25, 30, 28, 35, 27],
            'Ciudad': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'],
            'Salario': [30000, 45000, 38000, 52000, 41000]
        }
        df = pd.DataFrame(data)
        return {
            "success": True, "pandas_version": pd.__version__,
            "dataframe": {"shape": df.shape, "columns": df.columns.tolist(), "data": df.to_dict('records')},
            "statistics": {
                "edad_promedio": float(df['Edad'].mean()),
                "salario_promedio": float(df['Salario'].mean()),
                "salario_max": float(df['Salario'].max()),
                "salario_min": float(df['Salario'].min())
            }
        }
    elif modo == "combinado":
        datos = np.random.randint(1, 100, (10, 3))
        df = pd.DataFrame(datos, columns=['A', 'B', 'C'])
        df['Suma'] = df.sum(axis=1)
        df['Promedio'] = df[['A', 'B', 'C']].mean(axis=1)
        return {
            "success": True, "dataframe": df.to_dict('records'),
            "statistics": {"total_suma": float(df['Suma'].sum()), "promedio_general": float(df['Promedio'].mean())}
        }
    else:
        arr1 = np.array([1, 2, 3, 4, 5])
        arr2 = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
        return {
            "success": True, "numpy_version": np.__version__,
            "arrays": {"arr1": arr1.tolist(), "arr2": arr2.tolist()},
            "operations": {
                "sum": float(np.sum(arr1)), "mean": float(np.mean(arr1)),
                "std": float(np.std(arr1)), "max": float(np.max(arr1)), "min": float(np.min(arr1)),
                "matrix_sum": float(np.sum(arr2)), "matrix_mean": float(np.mean(arr2))
            }
        }


def cmd_test_reportlab(args):
    """Crea un PDF de prueba con ReportLab."""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    import os

    output_path = args[0] if args else "test_reportlab.pdf"
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 24)
    c.drawString(100, height - 100, "Test ReportLab")
    c.setFont("Helvetica", 14)
    c.drawString(100, height - 140, "PDF creado exitosamente")
    c.line(100, height - 150, width - 100, height - 150)
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 180, "Este PDF fue generado con ReportLab")
    c.rect(100, height - 300, 200, 80, stroke=1, fill=0)
    c.circle(400, height - 260, 40, stroke=1, fill=0)
    c.save()

    return {"success": True, "output": output_path, "size": os.path.getsize(output_path), "pages": 1}


def cmd_test_matplotlib(args):
    """Crea un gráfico con Matplotlib."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np
    import os

    tipo = args[0] if args else "lineas"
    output_path = args[1] if len(args) > 1 else f"test_matplotlib_{tipo}.png"

    if tipo == "barras":
        plt.figure(figsize=(10, 6))
        plt.bar(['A', 'B', 'C', 'D', 'E'], [23, 45, 56, 78, 32], color='skyblue', edgecolor='navy')
        plt.xlabel('Categorías'); plt.ylabel('Valores'); plt.title('Gráfico de Barras')
    elif tipo == "dispersion":
        np.random.seed(42)
        x = np.random.randn(100); y = 2 * x + np.random.randn(100) * 0.5
        plt.figure(figsize=(10, 6))
        plt.scatter(x, y, alpha=0.6, c=y, cmap='viridis')
        plt.colorbar(label='Valor Y'); plt.title('Gráfico de Dispersión')
    elif tipo == "pastel":
        plt.figure(figsize=(10, 8))
        plt.pie([35, 25, 20, 15, 5], labels=['Python', 'JS', 'Java', 'C++', 'Otros'],
                colors=['#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#ff99cc'], autopct='%1.1f%%')
        plt.title('Distribución de Lenguajes')
    else:
        x = np.linspace(0, 10, 100)
        plt.figure(figsize=(10, 6))
        plt.plot(x, np.sin(x), label='sin(x)', linewidth=2)
        plt.plot(x, np.cos(x), label='cos(x)', linewidth=2)
        plt.legend(); plt.grid(True); plt.title('Sin y Cos')

    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    return {"success": True, "type": tipo, "output": output_path, "size": os.path.getsize(output_path)}


def cmd_test_opencv(args):
    """Crea una imagen con OpenCV."""
    import cv2
    import numpy as np
    import os

    output_path = args[0] if args else "test_opencv.png"
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    img.fill(255)
    cv2.rectangle(img, (50, 50), (550, 350), (0, 0, 255), 3)
    cv2.circle(img, (300, 200), 80, (255, 0, 0), -1)
    cv2.line(img, (100, 100), (500, 300), (0, 255, 0), 2)
    cv2.putText(img, 'OpenCV Test', (200, 380), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    cv2.imwrite(output_path, img)

    return {
        "success": True, "output": output_path, "size": os.path.getsize(output_path),
        "dimensions": [img.shape[1], img.shape[0]], "opencv_version": cv2.__version__
    }


def cmd_test_pillow(args):
    """Crea una imagen con Pillow."""
    from PIL import Image, ImageDraw
    import os

    output_path = args[0] if args else "test_pillow.png"
    img = Image.new('RGB', (400, 300), color='white')
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 350, 250], outline='blue', width=3)
    draw.ellipse([150, 100, 250, 200], fill='lightblue', outline='darkblue')
    draw.text((100, 260), "Test Pillow", fill='black')
    img.save(output_path)

    return {
        "success": True, "output": output_path, "size": os.path.getsize(output_path),
        "dimensions": img.size, "format": "PNG"
    }


def cmd_test_scipy():
    """Prueba funciones estadísticas de SciPy."""
    import numpy as np
    from scipy import stats

    datos = np.random.normal(100, 15, 100)
    return {
        "success": True,
        "statistics": {
            "mean": float(np.mean(datos)), "median": float(np.median(datos)),
            "std": float(np.std(datos)), "skewness": float(stats.skew(datos)),
            "kurtosis": float(stats.kurtosis(datos))
        },
        "tests": {
            "normaltest": {
                "statistic": float(stats.normaltest(datos)[0]),
                "pvalue": float(stats.normaltest(datos)[1])
            }
        }
    }


def cmd_test_pypdf(args):
    """Lee información de un PDF con PyPDF."""
    from pypdf import PdfReader

    if not args:
        return {"success": False, "error": "Uso: dispatcher test_pypdf <ruta_pdf>"}

    pdf_path = args[0]
    reader = PdfReader(pdf_path)
    info = {
        "success": True, "file": pdf_path, "pages": len(reader.pages), "metadata": {}
    }
    if reader.metadata:
        info["metadata"] = {
            "title": reader.metadata.get("/Title", "N/A"),
            "author": reader.metadata.get("/Author", "N/A"),
            "subject": reader.metadata.get("/Subject", "N/A"),
            "creator": reader.metadata.get("/Creator", "N/A")
        }
    if len(reader.pages) > 0:
        text = reader.pages[0].extract_text()
        info["text_preview"] = text[:200] if text else "Sin texto"
    return info


def cmd_test_pymupdf(args):
    """Analiza un PDF con PyMuPDF."""
    import fitz

    if not args:
        return {"success": False, "error": "Uso: dispatcher test_pymupdf <ruta_pdf>"}

    pdf_path = args[0]
    doc = fitz.open(pdf_path)
    info = {
        "success": True, "file": pdf_path, "pages": len(doc),
        "metadata": doc.metadata, "toc": doc.get_toc(), "page_sizes": []
    }
    for i, page in enumerate(doc):
        rect = page.rect
        info["page_sizes"].append({"page": i + 1, "width": rect.width, "height": rect.height})
    if len(doc) > 0:
        text = doc[0].get_text()
        info["text_preview"] = text[:200] if text else "Sin texto"
    doc.close()
    return info


def cmd_quick_test():
    """Prueba rápida de todas las bibliotecas."""
    def test_lib(nombre, modulo, test_func=None):
        try:
            mod = __import__(modulo)
            version = getattr(mod, '__version__', 'N/A')
            test_passed, test_error = True, None
            if test_func:
                try:
                    test_func(mod)
                except Exception as e:
                    test_passed, test_error = False, str(e)
            return {'instalado': True, 'version': version, 'test_passed': test_passed, 'test_error': test_error}
        except ImportError as e:
            return {'instalado': False, 'version': None, 'test_passed': False, 'test_error': str(e)}

    def t_numpy(mod):
        assert mod.sum(mod.array([1, 2, 3])) == 6

    def t_pandas(mod):
        assert len(mod.DataFrame({'A': [1, 2, 3]})) == 3

    def t_matplotlib(mod):
        mod.use('Agg')
        import matplotlib.pyplot as plt
        plt.plot([1, 2, 3]); plt.close()

    def t_opencv(mod):
        import numpy as np
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        mod.rectangle(img, (10, 10), (90, 90), (255, 0, 0), 2)

    def t_pillow(mod):
        from PIL import Image
        assert Image.new('RGB', (100, 100)).size == (100, 100)

    bibliotecas = [
        ('reportlab', 'reportlab', None), ('pypdf', 'pypdf', None),
        ('pymupdf', 'fitz', None), ('Pillow', 'PIL', t_pillow),
        ('opencv-python-headless', 'cv2', t_opencv), ('tifffile', 'tifffile', None),
        ('numpy', 'numpy', t_numpy), ('pandas', 'pandas', t_pandas),
        ('scipy', 'scipy', None), ('matplotlib', 'matplotlib', t_matplotlib),
        ('openpyxl', 'openpyxl', None), ('requests', 'requests', None)
    ]

    resultados = {}
    for nombre, modulo, test in bibliotecas:
        resultados[nombre] = test_lib(nombre, modulo, test)
    return resultados


def cmd_ejemplo_bibliotecas():
    """Ejemplo de uso de todas las bibliotecas."""
    resultados = {}

    try:
        import numpy as np
        import pandas as pd
        datos = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
        df = pd.DataFrame(datos, columns=['A', 'B', 'C'])
        resultados["numpy_pandas"] = {"promedio": float(df.mean().mean()), "suma_total": int(df.sum().sum())}
    except Exception as e:
        resultados["numpy_pandas"] = {"error": str(e)}

    try:
        from PIL import Image, ImageDraw
        import io, base64
        img = Image.new('RGB', (200, 100), color='white')
        ImageDraw.Draw(img).text((10, 40), "Hola desde PIL", fill='black')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        resultados["pillow"] = {"imagen_base64": base64.b64encode(buffer.getvalue()).decode()[:50] + "..."}
    except Exception as e:
        resultados["pillow"] = {"error": str(e)}

    try:
        import cv2
        resultados["opencv"] = {"opencv_version": cv2.__version__, "build_info": "headless"}
    except Exception as e:
        resultados["opencv"] = {"error": str(e)}

    try:
        import matplotlib
        matplotlib.use('Agg')
        resultados["matplotlib"] = {"version": matplotlib.__version__}
    except Exception as e:
        resultados["matplotlib"] = {"error": str(e)}

    try:
        from scipy import stats
        import numpy as np
        datos = np.random.normal(100, 15, 100)
        resultados["scipy"] = {"media": float(np.mean(datos)), "desviacion": float(np.std(datos))}
    except Exception as e:
        resultados["scipy"] = {"error": str(e)}

    resultados["success"] = True
    return resultados


if __name__ == "__main__":
    main()
