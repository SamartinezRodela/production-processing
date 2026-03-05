#!/usr/bin/env python3
"""
Script de ejemplo para compilar a .exe
Este script puede ser compilado con PyInstaller para crear un ejecutable de prueba

Uso:
    python test_exe_source.py [nombre]
    
Compilar a .exe:
    pip install pyinstaller
    pyinstaller --onefile test_exe_source.py
    copy dist\test_exe_source.exe ..\nest-files-py-embedded\executables\
"""

import sys
import json
from datetime import datetime

def main():
    # Obtener argumentos
    nombre = sys.argv[1] if len(sys.argv) > 1 else "Mundo"
    
    # Crear resultado
    resultado = {
        "mensaje": f"¡Hola desde ejecutable .exe: {nombre}!",
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "args_recibidos": sys.argv[1:],
        "total_args": len(sys.argv) - 1,
        "tipo": "ejecutable",
        "version": "1.0.0"
    }
    
    # Imprimir como JSON (esto es lo que captura el backend)
    print(json.dumps(resultado, ensure_ascii=False, indent=2))
    
    return 0

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        error_result = {
            "status": "error",
            "mensaje": f"Error en el ejecutable: {str(e)}",
            "tipo": "ejecutable"
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)
