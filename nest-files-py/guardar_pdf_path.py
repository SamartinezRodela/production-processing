import sys
import json
import os
import shutil

def guardar_pdf_en_ruta(datos):
    try:
        output_path= datos.get('output_path','')
        relative_path = datos.get('relative_path', '')
        input_path = datos.get('input_path','')#Donde esta el archivo
        file_name = os.path.basename(input_path)

        # Inicia el procesamiento
        print(f"PROGRESS:10:{file_name}", flush=True)

        if not all([output_path, relative_path, input_path]):
            return {"success": False, "error": "Faltan Parametros requeridos"}

        print(f"PROGRESS:30:{file_name}", flush=True)
        
        # 1. Limpiar barras iniciales para que os.path.join no lo trate como ruta absoluta
        relative_path = relative_path.lstrip('\\/')

        # 2. Construir la ruta completa destino (Base + Ruta Relativa)
        ruta_completa = os.path.join(output_path, relative_path)

        # 3. Obtener solo la parte de las carpetas (el directorio padre)
        directorio_final = os.path.dirname(ruta_completa)

        # 4. Crear todas las carpetas anidadas si no existen
        if directorio_final:
            os.makedirs(directorio_final, exist_ok=True)
            
        print(f"PROGRESS:60:{file_name}", flush=True)

        # 5. verficiar espacio disponible en disco 
        file_size = os.path.getsize(input_path)
        total, used, free = shutil.disk_usage(directorio_final)

        # Dejar un margen de seguridad de 1MB (1024 * 1024 bytes)
        if file_size + 1048576 > free:
            return {"success": False, "error": f"Disk Full: Not enough space in destination. Required: {file_size / 1024 / 1024:.2f} MB, Free: {free / 1024 / 1024:.2f} MB"}
        
        print(f"PROGRESS:60:{file_name}", flush=True)
        

        # 6. Copiar el archivo conservando sus metadatos original
        shutil.copy2(input_path, ruta_completa)
        
        print(f"PROGRESS:100:{file_name}", flush=True)

        return{
            "success":True,
            "mensaje":"Archivo guardo exitosamente",
            "ruta_absoluta": ruta_completa
        }

    except Exception as e:
        return {"success":False,"error":str(e)}

def main():
    try:
        datos= json.loads(sys.argv[1])
        resultado= guardar_pdf_en_ruta(datos)
        print(json.dumps(resultado))
    except Exception as e:
        print(json.dumps({"success":False,"error":str(e)}))

if __name__=="__main__":
    
    main()
