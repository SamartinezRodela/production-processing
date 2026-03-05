# 🔒 Guía: Proteger Scripts Python en Producción

Esta guía explica cómo proteger tus scripts Python para que no puedan ser modificados o leídos fácilmente por usuarios finales.

---

## 🎯 Opciones de Protección

### Nivel 1: Compilar a Bytecode (.pyc) ⭐

**Dificultad:** Fácil  
**Protección:** Baja-Media  
**Recomendado para:** Protección básica

### Nivel 2: Ofuscar el código ⭐⭐

**Dificultad:** Media  
**Protección:** Media  
**Recomendado para:** Protección moderada

### Nivel 3: Compilar a ejecutable con Cython ⭐⭐⭐

**Dificultad:** Media-Alta  
**Protección:** Alta  
**Recomendado para:** Máxima protección

### Nivel 4: Empaquetar con PyInstaller ⭐⭐

**Dificultad:** Media  
**Protección:** Media  
**Recomendado para:** Scripts independientes

---

## 🔐 Nivel 1: Compilar a Bytecode (.pyc)

Python compila automáticamente los scripts a bytecode (.pyc), que es más difícil de leer que el código fuente.

### Ventajas:

- ✅ Muy fácil de implementar
- ✅ No requiere dependencias adicionales
- ✅ Compatible con tu arquitectura actual

### Desventajas:

- ❌ Se puede descompilar con herramientas
- ❌ Protección básica

### Implementación:

#### 1. Crear script de compilación

**Archivo:** `compile_python.py`

```python
import py_compile
import os
import shutil
from pathlib import Path

def compile_scripts(source_dir, output_dir):
    """
    Compila todos los scripts Python a bytecode
    """
    # Crear directorio de salida
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Compilar cada archivo .py
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            if file.endswith('.py'):
                source_path = os.path.join(root, file)

                # Compilar a .pyc
                try:
                    py_compile.compile(
                        source_path,
                        cfile=os.path.join(output_dir, file + 'c'),
                        doraise=True
                    )
                    print(f"✅ Compilado: {file}")
                except Exception as e:
                    print(f"❌ Error compilando {file}: {e}")

if __name__ == "__main__":
    compile_scripts('nest-files-py', 'nest-files-py-compiled')
    print("\n✅ Compilación completa!")
```

#### 2. Ejecutar compilación

```powershell
py compile_python.py
```

#### 3. Modificar python.service.ts

```typescript
private readonly scriptsPath = process.env.NODE_ENV === 'production'
  ? path.join(process.resourcesPath, 'python-compiled')
  : path.resolve(__dirname, '../../../nest-files-py');
```

#### 4. Actualizar package.json de Electron

```json
"extraResources": [
  {
    "from": "../nest-files-py-compiled",
    "to": "python-compiled",
    "filter": ["**/*.pyc"]
  }
]
```

---

## 🎭 Nivel 2: Ofuscar el Código

Ofuscar hace el código ilegible pero funcional.

### Instalar pyarmor

```powershell
pip install pyarmor
```

### Ofuscar scripts

```powershell
# Ofuscar todos los scripts
pyarmor obfuscate --recursive --output nest-files-py-obfuscated nest-files-py/*.py

# O uno por uno
pyarmor obfuscate -O nest-files-py-obfuscated nest-files-py/generar_pdf.py
```

### Ejemplo de código ofuscado

**Antes:**

```python
def saludar(nombre):
    return f"Hola {nombre}"
```

**Después:**

```python
from pytransform import pyarmor_runtime
pyarmor_runtime()
__pyarmor__(__name__, __file__, b'\x50\x59...[código encriptado]...')
```

### Ventajas:

- ✅ Código completamente ilegible
- ✅ Difícil de desofuscar
- ✅ Funciona igual que el original

### Desventajas:

- ❌ Requiere pyarmor instalado
- ❌ Puede tener problemas con algunas librerías

### Configuración en Electron

```json
"extraResources": [
  {
    "from": "../nest-files-py-obfuscated",
    "to": "python",
    "filter": ["**/*"]
  }
]
```

---

## 🚀 Nivel 3: Compilar con Cython (Máxima Protección)

Cython compila Python a código C, creando archivos binarios (.pyd en Windows, .so en Linux).

### Ventajas:

- ✅ Máxima protección (código binario)
- ✅ Imposible de descompilar a código legible
- ✅ Mejor rendimiento

### Desventajas:

- ❌ Más complejo de configurar
- ❌ Requiere compilador C
- ❌ Específico por plataforma

### Instalación

```powershell
pip install cython
```

### Crear setup.py

**Archivo:** `setup.py`

```python
from setuptools import setup
from Cython.Build import cythonize
import os

# Lista de scripts a compilar
scripts = [
    "nest-files-py/generar_pdf.py",
    "nest-files-py/saludar.py",
    "nest-files-py/calculate_stats.py"
]

setup(
    name='PythonScripts',
    ext_modules=cythonize(
        scripts,
        compiler_directives={
            'language_level': "3",
            'embedsignature': True
        }
    ),
)
```

### Compilar

```powershell
python setup.py build_ext --inplace
```

Esto genera archivos `.pyd` (Windows) o `.so` (Linux/Mac).

### Usar archivos compilados

Los archivos `.pyd` se importan como módulos normales:

```python
# En lugar de ejecutar el script, importarlo
import generar_pdf
resultado = generar_pdf.generar_pdf(datos)
```

---

## 📦 Nivel 4: PyInstaller (Scripts Independientes)

Convierte scripts Python en ejecutables independientes.

### Instalación

```powershell
pip install pyinstaller
```

### Crear ejecutable

```powershell
# Crear ejecutable de un script
pyinstaller --onefile --noconsole nest-files-py/generar_pdf.py
```

### Ventajas:

- ✅ No requiere Python instalado
- ✅ Archivo único ejecutable
- ✅ Difícil de modificar

### Desventajas:

- ❌ Archivos grandes
- ❌ Más lento que scripts normales
- ❌ Requiere cambios en la arquitectura

---

## 🎯 Solución Recomendada: Combinación

La mejor protección es combinar varias técnicas:

### Paso 1: Ofuscar con PyArmor

```powershell
pip install pyarmor
pyarmor obfuscate --recursive --output nest-files-py-protected nest-files-py/*.py
```

### Paso 2: Compilar a Bytecode

```python
# compile_protected.py
import py_compile
import os

for root, dirs, files in os.walk('nest-files-py-protected'):
    for file in files:
        if file.endswith('.py'):
            source = os.path.join(root, file)
            py_compile.compile(source, doraise=True)
            # Eliminar el .py original
            os.remove(source)
```

### Paso 3: Configurar Electron

```json
"extraResources": [
  {
    "from": "../nest-files-py-protected",
    "to": "python",
    "filter": ["**/*.pyc", "**/*.pyd", "pytransform/**/*"]
  }
]
```

---

## 🛡️ Protección Adicional: Verificación de Integridad

Agrega verificación de hash para detectar modificaciones:

### Script de verificación

**Archivo:** `nest-files-py/verify_integrity.py`

```python
import hashlib
import json
import sys

# Hashes de los scripts originales
HASHES = {
    "generar_pdf.py": "abc123...",
    "saludar.py": "def456...",
}

def verify_file(filename):
    """Verifica que el archivo no haya sido modificado"""
    try:
        with open(filename, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()

        if file_hash != HASHES.get(filename):
            return False
        return True
    except:
        return False

def main():
    # Verificar todos los archivos
    for filename in HASHES.keys():
        if not verify_file(filename):
            print(json.dumps({
                "error": "Archivo modificado o corrupto",
                "file": filename
            }))
            sys.exit(1)

    print(json.dumps({"verified": True}))

if __name__ == "__main__":
    main()
```

### Llamar antes de ejecutar scripts

```typescript
// En python.service.ts
async executeScript(scriptName: string, args: string[] = []): Promise<any> {
  // Verificar integridad primero
  await this.verifyIntegrity();

  // Luego ejecutar el script
  return new Promise((resolve, reject) => {
    // ... código existente
  });
}

private async verifyIntegrity(): Promise<void> {
  return new Promise((resolve, reject) => {
    const verifyScript = path.join(this.scriptsPath, 'verify_integrity.py');
    const pythonProcess = spawn(this.pythonPath, [verifyScript]);

    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Verificación de integridad falló'));
      } else {
        resolve();
      }
    });
  });
}
```

---

## 📋 Script Automatizado de Protección

**Archivo:** `protect-python.ps1`

```powershell
# protect-python.ps1
Write-Host "🔒 Protegiendo scripts Python..." -ForegroundColor Cyan

# 1. Instalar pyarmor si no está instalado
Write-Host "📦 Verificando pyarmor..." -ForegroundColor Yellow
pip show pyarmor > $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Instalando pyarmor..." -ForegroundColor Yellow
    pip install pyarmor
}

# 2. Limpiar directorio anterior
Write-Host "🧹 Limpiando directorio anterior..." -ForegroundColor Yellow
Remove-Item -Path "nest-files-py-protected" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Ofuscar scripts
Write-Host "🎭 Ofuscando scripts..." -ForegroundColor Cyan
pyarmor obfuscate --recursive --output nest-files-py-protected nest-files-py/*.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error ofuscando scripts" -ForegroundColor Red
    exit 1
}

# 4. Compilar a bytecode
Write-Host "⚙️ Compilando a bytecode..." -ForegroundColor Cyan
python -c "
import py_compile
import os
for root, dirs, files in os.walk('nest-files-py-protected'):
    for file in files:
        if file.endswith('.py') and not file.startswith('__'):
            source = os.path.join(root, file)
            try:
                py_compile.compile(source, doraise=True)
                print(f'Compilado: {file}')
            except Exception as e:
                print(f'Error: {e}')
"

Write-Host "✅ Scripts protegidos en: nest-files-py-protected/" -ForegroundColor Green
Write-Host "📝 Actualiza package.json para usar esta carpeta" -ForegroundColor Yellow
```

**Ejecutar:**

```powershell
.\protect-python.ps1
```

---

## 🔍 Comparación de Métodos

| Método          | Protección | Dificultad | Rendimiento | Compatibilidad |
| --------------- | ---------- | ---------- | ----------- | -------------- |
| Bytecode (.pyc) | ⭐⭐       | ⭐         | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐     |
| PyArmor         | ⭐⭐⭐⭐   | ⭐⭐       | ⭐⭐⭐⭐    | ⭐⭐⭐⭐       |
| Cython          | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐  | ⭐⭐⭐         |
| PyInstaller     | ⭐⭐⭐     | ⭐⭐⭐     | ⭐⭐⭐      | ⭐⭐⭐⭐       |
| Combinado       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐⭐⭐    | ⭐⭐⭐⭐       |

---

## ✅ Recomendación Final

Para tu caso (Electron + NestJS + Python):

### Opción Recomendada: PyArmor + Bytecode

1. **Fácil de implementar**
2. **Buena protección**
3. **No rompe la arquitectura actual**
4. **Compatible con todas las librerías**

### Pasos:

```powershell
# 1. Instalar PyArmor
pip install pyarmor

# 2. Proteger scripts
.\protect-python.ps1

# 3. Actualizar package.json
# Cambiar "nest-files-py" por "nest-files-py-protected"

# 4. Empaquetar
cd nest-electron
npm run dist:win
```

---

## 🚨 Importante

**Ningún método es 100% seguro.** Siempre es posible descompilar o hacer ingeniería inversa con suficiente esfuerzo. La protección es para:

- ✅ Dificultar modificaciones casuales
- ✅ Proteger propiedad intelectual
- ✅ Evitar manipulación accidental
- ❌ NO es seguridad absoluta

Para lógica crítica de negocio, considera:

- Mover la lógica al backend (NestJS)
- Usar APIs externas
- Implementar licenciamiento

---

**¡Scripts protegidos!** 🔒
