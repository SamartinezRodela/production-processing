"""
Script para compilar archivos Python a .pyc y generar hashes SHA-256
Uso: python compile-python-scripts.py [directorio]
Ejemplo: python compile-python-scripts.py nest-files-py-embedded-mac
"""
import py_compile
import hashlib
import os
import json
import sys
from pathlib import Path

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Directorio con los scripts Python (puede ser pasado como argumento)
if len(sys.argv) > 1:
    SCRIPTS_DIR = Path(sys.argv[1])
else:
    # Por defecto, usar Windows
    SCRIPTS_DIR = Path("nest-files-py-embedded")

# Scripts que queremos compilar
SCRIPTS_TO_COMPILE = [
    "saludar.py",
    "generar_pdf.py",
    "generar_pdf_path.py",
    "test_imports.py"
]

def compile_script(script_path: Path) -> Path:
    """Compila un script Python a bytecode"""
    print(f"[*] Compilando: {script_path.name}")
    
    # Compilar el archivo
    pyc_path = py_compile.compile(script_path, doraise=True)
    
    # Mover el .pyc al directorio principal (sin __pycache__)
    pyc_file = Path(pyc_path)
    new_pyc_path = script_path.parent / f"{script_path.stem}.pyc"
    
    # Si existe, eliminarlo
    if new_pyc_path.exists():
        new_pyc_path.unlink()
    
    # Mover el archivo
    pyc_file.rename(new_pyc_path)
    
    print(f"    [OK] Generado: {new_pyc_path.name}")
    return new_pyc_path

def calculate_hash(file_path: Path) -> str:
    """Calcula el hash SHA-256 de un archivo"""
    sha256_hash = hashlib.sha256()
    
    with open(file_path, "rb") as f:
        # Leer en bloques para archivos grandes
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    
    # Asegurar que el archivo se cierre completamente
    return sha256_hash.hexdigest()

def main():
    print("=" * 60)
    print("COMPILADOR DE SCRIPTS PYTHON + GENERADOR DE HASHES")
    print("=" * 60)
    print()
    print(f"Directorio objetivo: {SCRIPTS_DIR}")
    print()
    
    if not SCRIPTS_DIR.exists():
        print(f"[ERROR] Directorio {SCRIPTS_DIR} no encontrado")
        return
    
    hashes = {}
    compiled_files = []
    
    # Compilar cada script
    for script_name in SCRIPTS_TO_COMPILE:
        script_path = SCRIPTS_DIR / script_name
        
        if not script_path.exists():
            print(f"[WARNING] {script_name} no encontrado, saltando...")
            continue
        
        try:
            # Compilar
            pyc_path = compile_script(script_path)
            compiled_files.append(pyc_path)
            
            # Calcular hash
            file_hash = calculate_hash(pyc_path)
            hashes[pyc_path.name] = file_hash
            
            print(f"    [HASH] {file_hash[:16]}...")
            print()
            
        except Exception as e:
            print(f"[ERROR] Error compilando {script_name}: {e}")
            print()
    
    # Limpiar carpeta __pycache__ si existe
    pycache_dir = SCRIPTS_DIR / "__pycache__"
    if pycache_dir.exists():
        import shutil
        shutil.rmtree(pycache_dir)
        print("[OK] Limpiado __pycache__")
        print()
    
    # Guardar hashes en archivo JSON
    hashes_file = Path("python-hashes.json")
    with open(hashes_file, "w", encoding='utf-8') as f:
        json.dump(hashes, f, indent=2)
    
    print("=" * 60)
    print("COMPILACION COMPLETADA")
    print("=" * 60)
    print(f"Archivos compilados: {len(compiled_files)}")
    print(f"Hashes guardados en: {hashes_file}")
    print()
    print("HASHES GENERADOS:")
    print("-" * 60)
    
    # Generar código TypeScript para copiar/pegar
    print("\n// Copia esto en python.service.ts:")
    print("private readonly HASHES_WHITELIST: Record<string, string> = {")
    for filename, file_hash in hashes.items():
        print(f"  '{filename}': '{file_hash}',")
    print("};")
    print()
    
    print("Siguiente paso:")
    print("   1. Copia el codigo TypeScript de arriba")
    print("   2. Pegalo en nest-ui-be/src/python/python.service.ts")
    print("   3. Implementa la verificacion de integridad")
    print()
    
    # Forzar cierre de archivos y limpieza
    import gc
    gc.collect()

if __name__ == "__main__":
    main()
