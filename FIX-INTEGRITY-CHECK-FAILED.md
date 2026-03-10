# Fix: Integrity Check Failed en Producción

## Problema

Al instalar la aplicación y ejecutarla, aparecían errores en la consola:

```
Error completo: Error: Error invoking remote method 'python:saludar':
Error: Error en saludar: {"status":500,"data":{"statusCode":500,"message":"Internal server error"}}

Error: Error invoking remote method 'python:generar-path-pdf':
Error: Error en generar-pdf: {"error":"El archivo ha sido modificado o no existe",
"details":{"errno":"Integrity check failed","message":"El archivo ha sido modificado o no existe",
"code":"El archivo ha sido modificado o no existe","fileName":"generar_pdf_path.pyc",
"hint":"🔒 Error de integridad del sistema. Por favor reinstala la aplicación."}}
```

## Causa Raíz

Los hashes SHA-256 estaban **hardcodeados** en `python.service.ts`:

```typescript
private readonly HASHES_WHITELIST: Record<string, string> = {
  'saludar.pyc': 'ba1c475e5b3b3a9ce0dfbabff26a3cf719d9077b02adaeacdac562788b695403',
  'generar_pdf.pyc': 'c3cef2da48d911967ac50dcda42fd720ad7569339337b9bd5f794b6eed967053',
  // ...
};
```

### ¿Por qué fallaba?

Los hashes generados en desarrollo (tu máquina) eran DIFERENTES a los generados en GitHub Actions porque:

1. **Versión de Python diferente**
   - Desarrollo: Python 3.13
   - GitHub Actions: Python 3.12
   - Resultado: Bytecode diferente

2. **Sistema operativo diferente**
   - Desarrollo: Windows local
   - GitHub Actions: Windows Server
   - Resultado: Paths y metadata diferentes

3. **Timestamp de compilación**
   - Los archivos `.pyc` incluyen timestamp
   - Cada compilación genera hashes diferentes

## Solución Aplicada

### 1. Cargar Hashes Dinámicamente

Modificado `nest-ui-be/src/python/python.service.ts`:

```typescript
@Injectable()
export class PythonService {
  private HASHES_WHITELIST: Record<string, string> = {};

  constructor() {
    this.loadHashesWhitelist();
  }

  private loadHashesWhitelist(): void {
    try {
      const resourcesPath =
        process.env.RESOURCES_PATH || (process as any).resourcesPath;

      let hashesPath: string;

      if (resourcesPath) {
        // Producción: cargar desde resources/backend
        hashesPath = path.join(resourcesPath, "backend", "python-hashes.json");
      } else {
        // Desarrollo: cargar desde la raíz del proyecto
        hashesPath = path.resolve(__dirname, "../../../python-hashes.json");
      }

      if (fs.existsSync(hashesPath)) {
        const hashesData = fs.readFileSync(hashesPath, "utf8");
        this.HASHES_WHITELIST = JSON.parse(hashesData);
        this.logger.log(`✅ Hashes cargados desde: ${hashesPath}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error cargando hashes: ${error.message}`);
    }
  }
}
```

### 2. Incluir python-hashes.json en el Build

Modificado `nest-electron/package.json`:

```json
"extraResources": [
  {
    "from": "../python-hashes.json",
    "to": "backend/python-hashes.json"
  }
]
```

## Flujo Actualizado

### Desarrollo Local

```
1. Ejecutar: python compile-python-scripts.py
2. Genera: python-hashes.json (con hashes locales)
3. Backend carga: python-hashes.json desde raíz del proyecto
4. ✅ Verificación funciona con hashes locales
```

### GitHub Actions (Producción)

```
1. GitHub Actions ejecuta: python compile-python-scripts.py
2. Genera: python-hashes.json (con hashes de Actions)
3. Electron Builder copia: python-hashes.json a resources/backend/
4. Backend carga: python-hashes.json desde resources/backend/
5. ✅ Verificación funciona con hashes de producción
```

## Beneficios

✅ **Hashes siempre correctos**: Se generan en el mismo entorno donde se compilan los scripts
✅ **Sin hardcodeo**: No necesitas copiar/pegar hashes manualmente
✅ **Multiplataforma**: Funciona en Windows y Mac automáticamente
✅ **Mantenible**: Un solo archivo de hashes para todo

## Testing

Para verificar que funciona:

1. Instalar la aplicación desde GitHub Actions
2. Abrir DevTools (F12)
3. Verificar en la consola del backend:
   ```
   ✅ Hashes cargados desde: C:\...\resources\backend\python-hashes.json
      Archivos en whitelist: 4
   ```
4. Ejecutar funciones Python (saludar, generar PDF)
5. Verificar que no hay errores de integridad

## Estructura de Archivos en Producción

```
C:\Program Files\Production Processing\
├── Production Processing.exe
└── resources\
    ├── backend\
    │   ├── dist\
    │   ├── node_modules\
    │   ├── package.json
    │   └── python-hashes.json  ← NUEVO
    ├── frontend\
    └── python\
        ├── saludar.pyc
        ├── generar_pdf.pyc
        └── ...
```

## Commits Relacionados

- `8dd0bc8` - fix: cargar hashes desde python-hashes.json en lugar de hardcodear

## Referencias

- Archivo de hashes: `python-hashes.json`
- Servicio Python: `nest-ui-be/src/python/python.service.ts`
- Configuración Electron: `nest-electron/package.json`
- Script de compilación: `compile-python-scripts.py`
