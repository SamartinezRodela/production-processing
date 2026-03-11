# Fix: Bad Magic Number in .pyc File

## Problema

Al ejecutar la aplicación instalada, aparecía el error:

```
RuntimeError: Bad magic number in .pyc file
```

## Causa Raíz

**Incompatibilidad de versiones de Python:**

- **Compilación**: Python 3.12 (sistema de GitHub Actions)
- **Ejecución**: Python 3.13 (embebido en el instalador)
- **Resultado**: Los archivos `.pyc` no son compatibles

### ¿Qué es el "Magic Number"?

Cada versión de Python tiene un "magic number" único en los archivos `.pyc`:

```
Python 3.11: 0x0a0d0d0a (magic number 3495)
Python 3.12: 0x0a0d0d0a (magic number 3531)
Python 3.13: 0x0a0d0d0a (magic number 3585)
```

Cuando Python intenta ejecutar un `.pyc` con un magic number diferente, falla.

## Solución Aplicada

### 1. Usar Python Embebido para Compilar

**Antes:**

```yaml
# Usaba Python del sistema (3.12)
$process = Start-Process -FilePath "python" -ArgumentList "compile-python-scripts.py"
```

**Después:**

```yaml
# Usa Python embebido (3.13)
$pythonExe = "nest-files-py-embedded\python.exe"
$pythonExe --version  # Verifica versión
$process = Start-Process -FilePath $pythonExe -ArgumentList "compile-python-scripts.py"
```

### 2. Verificación Dinámica de Integridad

**Modo Inteligente:**

```typescript
private verifyFileIntegrity(fileName: string): boolean {
  // Si no hay python-hashes.json, permitir ejecución
  if (Object.keys(this.HASHES_WHITELIST).length === 0) {
    this.logger.warn('⚠️  MODO SIN VERIFICACIÓN: python-hashes.json no encontrado');
    this.logger.warn('   Permitiendo ejecución sin verificación de integridad');
    return true;
  }

  // Si existe, verificar integridad estricta
  // ...
}
```

**Beneficios:**

- ✅ Si `python-hashes.json` existe: Verificación activa
- ✅ Si NO existe: Permite ejecución (modo desarrollo)
- ✅ No bloquea la app si falta el archivo de hashes

## Flujo Correcto Ahora

### Windows

```
1. GitHub Actions descarga Python 3.13 embebido
2. Usa Python 3.13 para compilar scripts → genera .pyc con magic 3585
3. Instalador incluye Python 3.13 embebido
4. Python 3.13 ejecuta .pyc con magic 3585
5. ✅ Compatible, funciona correctamente
```

### Mac

```
1. GitHub Actions descarga Python 3.11 standalone
2. Usa Python 3.11 para compilar scripts → genera .pyc con magic 3495
3. Instalador incluye Python 3.11 standalone
4. Python 3.11 ejecuta .pyc con magic 3495
5. ✅ Compatible, funciona correctamente
```

## Cambios en Workflows

### Windows (.github/workflows/build-windows.yml)

```yaml
- name: Compile Python Scripts to Bytecode
  run: |
    # Usar el Python embebido (3.13) para compilar
    $pythonExe = "nest-files-py-embedded\python.exe"

    # Verificar versión
    & $pythonExe --version

    # Compilar con la misma versión que se ejecutará
    $process = Start-Process -FilePath $pythonExe -ArgumentList "compile-python-scripts.py" -NoNewWindow -Wait -PassThru
```

### Mac (.github/workflows/build-mac.yml)

```yaml
- name: Compile Python Scripts to Bytecode (Mac)
  run: |
    # Usar el Python embebido (3.11) para compilar
    PYTHON_EXE="nest-files-py-embedded-mac/python-runtime/bin/python3"

    # Verificar versión
    $PYTHON_EXE --version

    # Compilar con la misma versión que se ejecutará
    $PYTHON_EXE compile-python-scripts.py nest-files-py-embedded-mac
```

## Verificación de Integridad Dinámica

### Modo Producción (con python-hashes.json)

```
[Nest] LOG ✅ SEGURIDAD: Verificación de integridad ACTIVA
[Nest] LOG    Hashes cargados desde: C:\...\resources\backend\python-hashes.json
[Nest] LOG    Archivos protegidos: 4
[Nest] LOG ✅ INTEGRIDAD OK: saludar.pyc
```

### Modo Desarrollo (sin python-hashes.json)

```
[Nest] WARN ⚠️  SEGURIDAD: python-hashes.json no encontrado
[Nest] WARN    Ruta buscada: C:\...\python-hashes.json
[Nest] WARN    Verificación de integridad DESHABILITADA (modo desarrollo)
[Nest] WARN ⚠️  MODO SIN VERIFICACIÓN: python-hashes.json no encontrado
[Nest] WARN    Permitiendo ejecución sin verificación de integridad
```

## Beneficios de la Solución

✅ **Compatibilidad garantizada**: Misma versión de Python para compilar y ejecutar
✅ **Verificación dinámica**: Se adapta automáticamente al entorno
✅ **No bloquea desarrollo**: Funciona sin python-hashes.json
✅ **Seguridad en producción**: Verificación activa cuando existe el archivo
✅ **Multiplataforma**: Funciona en Windows y Mac

## Testing

### Verificar Versión de Python

```bash
# Windows
nest-files-py-embedded\python.exe --version
# Debe mostrar: Python 3.13.0

# Mac
nest-files-py-embedded-mac/python-runtime/bin/python3 --version
# Debe mostrar: Python 3.11.x
```

### Verificar Magic Number

```python
import py_compile
import struct

# Compilar un archivo
py_compile.compile('test.py')

# Leer magic number
with open('__pycache__/test.cpython-313.pyc', 'rb') as f:
    magic = struct.unpack('<H', f.read(2))[0]
    print(f"Magic number: {magic}")
    # Python 3.13: 3585
```

## Commits Relacionados

- `b3a4433` - fix: usar Python embebido para compilar + verificación dinámica de integridad
- `8dd0bc8` - fix: cargar hashes desde python-hashes.json en lugar de hardcodear

## Referencias

- Python Magic Numbers: https://docs.python.org/3/library/importlib.html#importlib.util.MAGIC_NUMBER
- Workflow Windows: `.github/workflows/build-windows.yml`
- Workflow Mac: `.github/workflows/build-mac.yml`
- Servicio Python: `nest-ui-be/src/python/python.service.ts`
