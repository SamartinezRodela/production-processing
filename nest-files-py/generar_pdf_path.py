import sys
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import os


def generar_pdf_path(datos):
    """
    Genera un archivo PDF con la informacion con path dinamico
    
    y el path donde se guarda el archivo pdf
    Args:
        datos (dict): Un diccionario que contiene la informacion del documento
            - titulo: Título del documento
            - contenido: Texto del contenido
            - autor: Nombre del autor
            - nombre_archivo: Nombre del archivo a generar
            - ruta_salida: Carpeta donde guardar el PDF
        
    Returns:
        dict: Resultado de la operación con la ruta del archivo generado
    """

    try:
        titulo = datos.get('titulo', 'Documento sin titulo')
        contenido = datos.get('contenido', '')
        autor = datos.get('autor', 'Anonimo')
        nombre_archivo = datos.get('nombre_archivo', 'documento.pdf')
        ruta_salida = datos.get('ruta_salida', None)

        if not nombre_archivo.endswith('.pdf'):
            nombre_archivo += '.pdf'

        # Determinar ruta completa
        if ruta_salida:
            os.makedirs(ruta_salida, exist_ok=True)
            ruta_completa = os.path.join(ruta_salida, nombre_archivo)
        else:
            ruta_completa = nombre_archivo

        # Crear el PDF
        c = canvas.Canvas(ruta_completa, pagesize=letter)
        width, height = letter

        # Título
        c.setFont("Helvetica-Bold", 24)
        c.drawString(1*inch, height - 1*inch, titulo)

        # Autor y fecha
        c.setFont("Helvetica", 10)
        c.drawString(1*inch, height - 1.3*inch, f"Autor: {autor}")
        c.drawString(1*inch, height - 1.5*inch, f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

        # Línea separadora
        c.line(1*inch, height - 1.7*inch, width - 1*inch, height - 1.7*inch)

        # Contenido
        c.setFont("Helvetica", 12)

        # Dividir contenido en líneas
        y_position = height - 2.2*inch
        max_width = width - 2*inch

        # Procesar el contenido línea por línea
        for linea in contenido.split('\n'):
            if y_position < 1*inch:
                c.showPage()
                y_position = height - 1*inch
                c.setFont("Helvetica", 12)

            # Dividir líneas largas
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

        # Guardar el PDF
        c.save()

        # Obtener ruta absoluta del archivo guardado
        ruta_absoluta = os.path.abspath(ruta_completa)

        return {
            "success": True,
            "mensaje": f"PDF generado exitosamente: {nombre_archivo}",
            "archivo": nombre_archivo,
            "ruta": ruta_absoluta,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "tipo_error": type(e).__name__
        }


def main():
    """Función principal"""
    try:
        # Verificar argumentos
        if len(sys.argv) < 2:
            print(json.dumps({
                "success": False,
                "error": "Se requiere un objeto JSON con los datos del PDF"
            }))
            sys.exit(1)

        # Parsear JSON de entrada
        datos_json = sys.argv[1]
        datos = json.loads(datos_json)

        # Generar PDF
        resultado = generar_pdf_path(datos)

        # Retornar resultado
        print(json.dumps(resultado, indent=2))

        # Salir con código apropiado
        sys.exit(0 if resultado.get("success") else 1)

    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "error": f"JSON inválido: {str(e)}"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
