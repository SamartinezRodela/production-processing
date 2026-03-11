"""
Test: Pillow (PIL) - Manipulación de imágenes
"""
import sys
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os

def crear_imagen(output_path):
    """Crear una imagen de prueba"""
    try:
        # Crear imagen
        img = Image.new('RGB', (400, 300), color='white')
        draw = ImageDraw.Draw(img)
        
        # Rectángulo
        draw.rectangle([50, 50, 350, 250], outline='blue', width=3)
        
        # Círculo
        draw.ellipse([150, 100, 250, 200], fill='lightblue', outline='darkblue')
        
        # Texto
        draw.text((100, 260), "Test Pillow", fill='black')
        
        # Guardar
        img.save(output_path)
        
        return {
            "success": True,
            "output": output_path,
            "size": os.path.getsize(output_path),
            "dimensions": img.size,
            "format": img.format or "PNG"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def procesar_imagen(input_path, output_path):
    """Procesar una imagen existente"""
    try:
        img = Image.open(input_path)
        
        # Información original
        info = {
            "success": True,
            "input": input_path,
            "original": {
                "size": img.size,
                "format": img.format,
                "mode": img.mode
            },
            "operations": []
        }
        
        # Redimensionar
        img_resized = img.resize((img.width // 2, img.height // 2))
        resize_path = output_path.replace('.', '_resized.')
        img_resized.save(resize_path)
        info["operations"].append({
            "type": "resize",
            "output": resize_path,
            "size": img_resized.size
        })
        
        # Aplicar filtro
        img_blur = img.filter(ImageFilter.BLUR)
        blur_path = output_path.replace('.', '_blur.')
        img_blur.save(blur_path)
        info["operations"].append({
            "type": "blur",
            "output": blur_path
        })
        
        # Ajustar brillo
        enhancer = ImageEnhance.Brightness(img)
        img_bright = enhancer.enhance(1.5)
        bright_path = output_path.replace('.', '_bright.')
        img_bright.save(bright_path)
        info["operations"].append({
            "type": "brightness",
            "output": bright_path
        })
        
        return info
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        output = sys.argv[1]
        resultado = crear_imagen(output)
    else:
        output = "test_pillow.png"
        resultado = crear_imagen(output)
    
    print(json.dumps(resultado, indent=2))
