"""
Test: PyPDF - Leer y manipular PDFs
"""
import sys
import json
from pypdf import PdfReader, PdfWriter
import os

def leer_pdf(pdf_path):
    """Leer información de un PDF"""
    try:
        reader = PdfReader(pdf_path)
        
        info = {
            "success": True,
            "file": pdf_path,
            "pages": len(reader.pages),
            "metadata": {},
            "text_preview": ""
        }
        
        # Metadata
        if reader.metadata:
            info["metadata"] = {
                "title": reader.metadata.get("/Title", "N/A"),
                "author": reader.metadata.get("/Author", "N/A"),
                "subject": reader.metadata.get("/Subject", "N/A"),
                "creator": reader.metadata.get("/Creator", "N/A")
            }
        
        # Texto de la primera página
        if len(reader.pages) > 0:
            text = reader.pages[0].extract_text()
            info["text_preview"] = text[:200] if text else "Sin texto"
        
        return info
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def dividir_pdf(pdf_path, output_dir):
    """Dividir PDF en páginas individuales"""
    try:
        reader = PdfReader(pdf_path)
        resultados = []
        
        os.makedirs(output_dir, exist_ok=True)
        
        for i, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)
            
            output_path = os.path.join(output_dir, f"page_{i+1}.pdf")
            with open(output_path, "wb") as output_file:
                writer.write(output_file)
            
            resultados.append({
                "page": i + 1,
                "output": output_path,
                "size": os.path.getsize(output_path)
            })
        
        return {
            "success": True,
            "total_pages": len(reader.pages),
            "files": resultados
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        resultado = leer_pdf(pdf_path)
    else:
        resultado = {
            "error": "Uso: python test_pypdf.py <ruta_pdf>"
        }
    
    print(json.dumps(resultado, indent=2))
