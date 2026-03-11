"""
Test: OpenCV (cv2) - Visión por computadora
"""
import sys
import json
import cv2
import numpy as np
import os

def crear_imagen_opencv(output_path):
    """Crear imagen con OpenCV"""
    try:
        # Crear imagen en blanco
        img = np.zeros((400, 600, 3), dtype=np.uint8)
        img.fill(255)  # Fondo blanco
        
        # Rectángulo
        cv2.rectangle(img, (50, 50), (550, 350), (0, 0, 255), 3)
        
        # Círculo
        cv2.circle(img, (300, 200), 80, (255, 0, 0), -1)
        
        # Línea
        cv2.line(img, (100, 100), (500, 300), (0, 255, 0), 2)
        
        # Texto
        cv2.putText(img, 'OpenCV Test', (200, 380), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        # Guardar
        cv2.imwrite(output_path, img)
        
        return {
            "success": True,
            "output": output_path,
            "size": os.path.getsize(output_path),
            "dimensions": [img.shape[1], img.shape[0]],
            "opencv_version": cv2.__version__,
            "build_info": "headless"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def procesar_imagen_opencv(input_path, output_dir):
    """Procesar imagen con OpenCV"""
    try:
        img = cv2.imread(input_path)
        
        if img is None:
            return {
                "success": False,
                "error": "No se pudo leer la imagen"
            }
        
        os.makedirs(output_dir, exist_ok=True)
        
        info = {
            "success": True,
            "input": input_path,
            "dimensions": [img.shape[1], img.shape[0]],
            "operations": []
        }
        
        # Escala de grises
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray_path = os.path.join(output_dir, "gray.png")
        cv2.imwrite(gray_path, gray)
        info["operations"].append({"type": "grayscale", "output": gray_path})
        
        # Blur
        blur = cv2.GaussianBlur(img, (15, 15), 0)
        blur_path = os.path.join(output_dir, "blur.png")
        cv2.imwrite(blur_path, blur)
        info["operations"].append({"type": "blur", "output": blur_path})
        
        # Detección de bordes
        edges = cv2.Canny(gray, 100, 200)
        edges_path = os.path.join(output_dir, "edges.png")
        cv2.imwrite(edges_path, edges)
        info["operations"].append({"type": "edges", "output": edges_path})
        
        # Redimensionar
        resized = cv2.resize(img, (img.shape[1]//2, img.shape[0]//2))
        resized_path = os.path.join(output_dir, "resized.png")
        cv2.imwrite(resized_path, resized)
        info["operations"].append({"type": "resize", "output": resized_path})
        
        return info
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        output = sys.argv[1]
    else:
        output = "test_opencv.png"
    
    resultado = crear_imagen_opencv(output)
    print(json.dumps(resultado, indent=2))
