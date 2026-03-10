# 🔒 Guía de Build con Seguridad Habilitada

Este documento explica cómo funciona el sistema de seguridad implementado en la aplicación.

## 🎯 Características de Seguridad

### 1. Compilación a Bytecode (.pyc)

- Los scripts Python se distribuyen como bytecode compilado
- No se puede leer el código fuente con un editor de texto
- Dificulta la ingeniería inversa

### 2. Verificación de Integridad SHA-256

- Cada archivo `.pyc` tiene un hash SHA-256 único
- El backend verifica el hash antes de ejecutar cualquier script
- Si un archivo es modificado, la aplicación lo detecta y bloquea la ejecución

### 3. Empaquetado ASAR

- Los archivos de la aplicación están empaquetados en formato ASAR
- Dificulta la navegación de carpetas por usuarios curiosos
- Los archivos Python están en una carpeta "unpacked" para que el intérprete pueda leerlos

### 4. Python Embebido

- Python está incluido en la aplicación
- No depende de instalaciones del sistema
- Evita problemas con antivirus

## 📋 Proceso de Build

### Build Local (Desarrollo)

```bash
# 1. Compilar scripts Python a .pyc
python compile-python-scripts.py

# 2. Build completo con seguridad
.\FILES_PS\build-with-security.ps1
```

### Build con GitHub Actions (Producción)

El workflow `.github/workflows/build-windows.yml` automáticamente:

1. ✅ Descarga Python embebido
2. ✅ Instala dependencias (reportlab, etc.)
3. ✅ Copia scripts Python personalizados
4. ✅ **Compila scripts a .pyc**
5. ✅ **Genera hashes SHA-256**
6. ✅ Build del frontend (Angular)
7. ✅ Build del backend (NestJS)
8. ✅ Build de Electron con ASAR
9. ✅ Crea instalador y versión portable

## 🔑 Hashes SHA-256

Los hashes están definidos en `nest-ui-be/src/python/python.service.ts`:

```typescript
private readonly HASHES_WHITELIST: Record<string, string> = {
  'saludar.pyc': 'ba1c475e5b3b3a9ce0dfbabff26a3cf719d9077b02adaeacdac562788b695403',
  'generar_pdf.pyc': 'c3cef2da48d911967ac50dcda42fd720ad7569339337b9bd5f794b6eed967053',
  'generar_pdf_path.pyc': 'cf579ea5fbd85bfe168f92beba9a26b963cd554e2e4692242a97aa51c6059791',
  'test_imports.pyc': '9082a4ef074c4843fb80f0e2cc36a3ff4485aeb913a7f9e7bd43007748be0507',
};
```

### ⚠️ Importante: Actualizar Hashes

Si modificas un script Python:

1. Ejecuta `python compile-python-scripts.py`
2. Copia los nuevos hashes del output
3. Actualiza `HASHES_WHITELIST` en `python.service.ts`
4. Commit y push

## 🛡️ Cómo Funciona la Verificación

### Flujo de Ejecución

```
Usuario solicita operación
         ↓
Frontend llama al Backend
         ↓
Backend recibe petición
         ↓
🔒 VERIFICACIÓN DE INTEGRIDAD
   ├─ ¿Existe el archivo .pyc?
   ├─ ¿Está en la whitelist?
   ├─ Calcular hash SHA-256
   └─ ¿Hash coincide?
         ↓
   ✅ SÍ → Ejecutar script
   ❌ NO → Bloquear y retornar error
```

### Ejemplo de Verificación

```typescript
// En python.service.ts
async executeScript(scriptName: string, args: string[] = []): Promise<any> {
  // Convertir .py a .pyc
  let finalScriptName = scriptName.replace('.py', '.pyc');

  // Verificar integridad
  if (!this.verifyFileIntegrity(finalScriptName)) {
    throw new Error('🔒 Error de integridad del sistema');
  }

  // Ejecutar si pasó la verificación
  const pythonProcess = spawn(pythonExe, [scriptPath, ...args]);
  // ...
}
```

## 🧪 Testing de Integridad

### Endpoint de Verificación

```bash
# Verificar integridad de todos los archivos
GET http://localhost:3000/python/verify-integrity
```

Respuesta:

```json
{
  "scriptsPath": "C:\\path\\to\\nest-files-py-embedded",
  "totalFiles": 4,
  "results": {
    "saludar.pyc": {
      "status": "valid",
      "exists": true,
      "valid": true,
      "path": "C:\\path\\to\\saludar.pyc",
      "expectedHash": "ba1c475e...",
      "actualHash": "ba1c475e..."
    }
  }
}
```

### Probar Modificación de Archivo

```bash
# 1. Modificar un archivo .pyc manualmente
# 2. Intentar ejecutar una operación
# 3. Debería fallar con error de integridad
```

## 📦 Estructura de Archivos en Producción

```
Production Processing.exe
└── resources/
    ├── app.asar (Frontend + Backend empaquetados)
    └── python/ (Desempaquetado para ejecución)
        ├── python.exe
        ├── python313.dll
        ├── saludar.pyc ✅
        ├── generar_pdf.pyc ✅
        ├── generar_pdf_path.pyc ✅
        ├── test_imports.pyc ✅
        └── Lib/
            └── site-packages/
                └── reportlab/
```

## 🚨 Mensajes de Error

### Error de Integridad

```
❌ INTEGRIDAD COMPROMETIDA: saludar.pyc
   Hash esperado: ba1c475e...
   Hash actual:   xyz123...
   ⚠️  El archivo ha sido modificado o reemplazado
```

### Archivo Faltante

```
❌ INTEGRIDAD: Archivo no encontrado: saludar.pyc
   Ruta esperada: C:\path\to\saludar.pyc
```

### Usuario ve:

```json
{
  "error": "Integrity check failed",
  "message": "El archivo ha sido modificado o no existe",
  "fileName": "saludar.pyc",
  "hint": "🔒 Error de integridad del sistema. Por favor reinstala la aplicación."
}
```

## 🔄 Workflow de Actualización

### Agregar Nuevo Script Python

1. Crear `nuevo_script.py` en `nest-files-py/`
2. Agregar a `SCRIPTS_TO_COMPILE` en `compile-python-scripts.py`:
   ```python
   SCRIPTS_TO_COMPILE = [
       "saludar.py",
       "generar_pdf.py",
       "generar_pdf_path.py",
       "test_imports.py",
       "nuevo_script.py",  # ← Agregar aquí
   ]
   ```
3. Ejecutar `python compile-python-scripts.py`
4. Copiar el hash generado
5. Agregar a `HASHES_WHITELIST` en `python.service.ts`
6. Agregar método en `python.service.ts`:
   ```typescript
   async nuevoScript(param: string): Promise<any> {
     return this.executeScript('nuevo_script.py', [param]);
   }
   ```
7. Agregar endpoint en `python.controller.ts`
8. Commit y push

## 📊 Nivel de Protección

| Contra                                | Efectividad         |
| ------------------------------------- | ------------------- |
| Usuario casual navegando carpetas     | ✅ Alta             |
| Usuario intentando modificar archivos | ✅ Alta             |
| Usuario borrando archivos             | ✅ Alta (detectado) |
| Usuario técnico con curiosidad        | ⚠️ Media            |
| Desarrollador con herramientas        | ⚠️ Baja             |

## 💡 Notas Importantes

- ✅ Los archivos `.pyc` NO son encriptación, son compilación
- ✅ La verificación de hash detecta modificaciones
- ✅ ASAR dificulta (no impide) el acceso a archivos
- ⚠️ Un desarrollador determinado puede saltarse estas protecciones
- ✅ Es suficiente para proteger contra usuarios curiosos/maliciosos casuales

## 🔗 Archivos Relacionados

- `compile-python-scripts.py` - Script de compilación
- `python-hashes.json` - Hashes generados (no se commitea)
- `nest-ui-be/src/python/python.service.ts` - Verificación de integridad
- `.github/workflows/build-windows.yml` - Build automatizado
- `FILES_PS/build-with-security.ps1` - Build local
- `nest-electron/package.json` - Configuración ASAR

## 📞 Soporte

Si encuentras problemas con la verificación de integridad:

1. Verifica que los hashes en `python.service.ts` estén actualizados
2. Ejecuta `GET /python/verify-integrity` para diagnóstico
3. Revisa los logs del backend para mensajes de integridad
4. Si es necesario, recompila los scripts con `compile-python-scripts.py`
