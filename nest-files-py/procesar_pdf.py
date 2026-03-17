import sys
import json
import os
from datetime import datetime
from pathlib import Path
import shutil


def procesar_pdf(datos):
    """
    Procesa un archivo PDF de entrada y genera uno de salida.
    
    Args:
        datos (dict): Diccionario con la información del procesamiento
            - input_path: Ruta completa del archivo PDF de entrada
            - file_name: Nombre del archivo (con extensión)
            - output_path: Carpeta donde guardar el PDF procesado
            - base_path: Ruta base de los templates/archivos base
            - style: Estilo del archivo (opcional)
            - size: Tamaño del archivo (opcional)
        
    Returns:
        dict: Resultado de la operación con información del archivo procesado
    """
    
    try:
        # Extraer parámetros
        input_path = datos.get('input_path')
        file_name = datos.get('file_name')
        output_path = datos.get('output_path')
        base_path = datos.get('base_path')
        style = datos.get('style', 'N/A')
        size = datos.get('size', 'N/A')
        
        # Validar parámetros requeridos
        if not input_path:
            return {
                "success": False,
                "error": "input_path is required"
            }
        
        if not file_name:
            return {
                "success": False,
                "error": "file_name is required"
            }
        
        if not output_path:
            return {
                "success": False,
                "error": "output_path is required"
            }
        
        # Validar que el archivo de entrada existe
        if not os.path.exists(input_path):
            return {
                "success": False,
                "error": f"Input file does not exist: {input_path}"
            }
        
        # Validar que es un archivo PDF
        if not file_name.lower().endswith('.pdf'):
            return {
                "success": False,
                "error": f"File is not a PDF: {file_name}"
            }
        
        # Crear carpeta de salida si no existe
        os.makedirs(output_path, exist_ok=True)
        
        # Construir ruta de salida completa
        output_file_path = os.path.join(output_path, file_name)
        
        # Obtener información del archivo de entrada
        input_size = os.path.getsize(input_path)
        input_modified = datetime.fromtimestamp(os.path.getmtime(input_path))
        
        # Procesar el archivo (por ahora, copiar)
        # AQUÍ PUEDES AGREGAR TU LÓGICA DE PROCESAMIENTO
        # Por ejemplo: usar PyPDF2, PyMuPDF, etc.
        shutil.copy2(input_path, output_file_path)
        
        # Si hay base_path, buscar template correspondiente
        template_path = None
        if base_path and style != 'N/A' and size != 'N/A':
            # Buscar template en base_path/style/size.pdf
            possible_template = os.path.join(base_path, style, f"{size}.pdf")
            if os.path.exists(possible_template):
                template_path = possible_template
        
        # Obtener información del archivo de salida
        output_size = os.path.getsize(output_file_path)
        output_absolute = os.path.abspath(output_file_path)
        
        return {
            "success": True,
            "mensaje": f"PDF procesado exitosamente: {file_name}",
            "input": {
                "path": input_path,
                "size": input_size,
                "modified": input_modified.isoformat()
            },
            "output": {
                "path": output_absolute,
                "relative_path": output_file_path,
                "size": output_size,
                "file_name": file_name
            },
            "metadata": {
                "style": style,
                "size": size,
                "base_path": base_path,
                "template_found": template_path is not None,
                "template_path": template_path
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except PermissionError as e:
        return {
            "success": False,
            "error": f"Permission denied: {str(e)}",
            "tipo_error": "PermissionError"
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
                "error": "Se requiere un objeto JSON con los datos del procesamiento"
            }))
            sys.exit(1)
        
        # Parsear JSON de entrada
        datos_json = sys.argv[1]
        datos = json.loads(datos_json)
        
        # Procesar PDF
        resultado = procesar_pdf(datos)
        
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
            "error": str(e),
            "tipo_error": type(e).__name__
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
