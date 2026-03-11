"""
Test: ReportLab - Crear PDFs desde cero
"""
import sys
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
import os

def crear_pdf_simple(output_path):
    """Crear un PDF simple con ReportLab"""
    try:
        c = canvas.Canvas(output_path, pagesize=letter)
        width, height = letter
        
        # Título
        c.setFont("Helvetica-Bold", 24)
        c.drawString(100, height - 100, "Test ReportLab")
        
        # Subtítulo
        c.setFont("Helvetica", 14)
        c.drawString(100, height - 140, "PDF creado exitosamente")
        
        # Línea
        c.line(100, height - 150, width - 100, height - 150)
        
        # Texto
        c.setFont("Helvetica", 12)
        c.drawString(100, height - 180, "Este PDF fue generado con ReportLab")
        c.drawString(100, height - 200, f"Tamaño de página: {width} x {height}")
        
        # Rectángulo
        c.rect(100, height - 300, 200, 80, stroke=1, fill=0)
        c.drawString(110, height - 240, "Rectángulo de prueba")
        
        # Círculo
        c.circle(400, height - 260, 40, stroke=1, fill=0)
        
        c.save()
        
        return {
            "success": True,
            "output": output_path,
            "size": os.path.getsize(output_path),
            "pages": 1
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        output = sys.argv[1]
    else:
        output = "test_reportlab.pdf"
    
    resultado = crear_pdf_simple(output)
    print(json.dumps(resultado, indent=2))
