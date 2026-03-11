"""
Test: PyMuPDF (fitz) - Leer, editar y extraer de PDFs
"""
import sys
import json
import fitz  # PyMuPDF
import os

def analizar_pdf(pdf_path):
    """Analizar PDF con PyMuPDF"""
    try:
        doc = fitz.open(pdf_path)
        
        info = {
            "success": True,
            "file": pdf_path,
            "pages": len(doc),
            "metadata": doc.metadata,
            "toc": doc.get_toc(),
            "page_sizes": []
        }
        
        # Tamaños de páginas
        for i, page in enumerate(doc):
            rect = page.rect
            info["page_sizes"].append({
                "page": i + 1,
                "width": rect.width,
                "height": rect.height
            })
        
        # Texto de primera página
        if len(doc) > 0:
            text = doc[0].get_text()
            info["text_preview"] = text[:200] if text else "Sin texto"
        
        doc.close()
        return info
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def extraer_imagenes(pdf_path, output_dir):
    """Extraer imágenes de un PDF"""
    try:
        doc = fitz.open(pdf_path)
        os.makedirs(output_dir, exist_ok=True)
        
        imagenes = []
        img_count = 0
        
        for page_num, page in enumerate(doc):
            image_list = page.get_images()
            
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                img_count += 1
                output_path = os.path.join(output_dir, f"img_p{page_num+1}_{img_count}.{image_ext}")
                
                with open(output_path, "wb") as img_file:
                    img_file.write(image_bytes)
                
                imagenes.append({
                    "page": page_num + 1,
                    "index": img_count,
                    "format": image_ext,
                    "size": len(image_bytes),
                    "output": output_path
                })
        
        doc.close()
        
        return {
            "success": True,
            "total_images": img_count,
            "images": imagenes
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        resultado = analizar_pdf(pdf_path)
    else:
        resultado = {
            "error": "Uso: python test_pymupdf.py <ruta_pdf>"
        }
    
    print(json.dumps(resultado, indent=2))
