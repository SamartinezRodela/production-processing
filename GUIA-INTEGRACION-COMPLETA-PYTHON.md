# Guía: Integración Completa Python → Backend → Frontend → Electron

Esta guía muestra cómo fluye una prueba de biblioteca Python desde el script hasta la interfaz de usuario.

## 🔄 Flujo Completo

```
┌─────────────────┐
│  Python Script  │  nest-files-py/test_numpy_pandas.py
│  (test_*.py)    │  Ejecuta operaciones con NumPy/Pandas
└────────┬────────┘  Retorna JSON
         │
         ▼
┌─────────────────┐
│  Python Service │  nest-ui-be/src/python/python.service.ts
│  (NestJS)       │  Ejecuta el script Python y parsea resultado
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Python Controller│  nest-ui-be/src/python/python.controller.ts
│  (NestJS)       │  Expone endpoint REST: GET /python/test/numpy
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PythonTestService│  nest-ui-fe/src/app/service/python-test.service.ts
│  (Angular)      │  Llama al endpoint HTTP
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Component      │  nest-ui-fe/src/app/pages/python-tests/
│  (Angular)      │  Muestra resultados en la UI
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Electron     │  nest-electron/src/main.ts
│  (Ventana App)  │  Renderiza la aplicación Angular
└─────────────────┘
```

## 📁 Archivos Creados

### Backend (NestJS)

#### 1. `nest-ui-be/src/python/python.service.ts`

Métodos agregados:

```typescript
async testAllLibraries(): Promise<any>
async testNumpy(): Promise<any>
async testPandas(): Promise<any>
async testMatplotlib(tipo: string, outputPath: string): Promise<any>
async testOpenCV(outputPath: string): Promise<any>
async testPillow(outputPath: string): Promise<any>
async testScipy(): Promise<any>
async testReportlab(outputPath: string): Promise<any>
async testPyPDF(pdfPath: string): Promise<any>
async testPyMuPDF(pdfPath: string): Promise<any>
async quickTest(): Promise<any>
```

#### 2. `nest-ui-be/src/python/python.controller.ts`

Endpoints agregados:

```typescript
GET  /python/test/quick          - Prueba rápida
GET  /python/test/libraries      - Verificar bibliotecas
GET  /python/test/numpy          - Probar NumPy
GET  /python/test/pandas         - Probar Pandas
GET  /python/test/scipy          - Probar SciPy
POST /python/test/matplotlib     - Crear gráfico
POST /python/test/opencv         - Crear imagen con OpenCV
POST /python/test/pillow         - Crear imagen con Pillow
POST /python/test/reportlab      - Crear PDF
POST /python/test/pypdf          - Leer PDF
POST /python/test/pymupdf        - Analizar PDF
```

### Frontend (Angular)

#### 3. `nest-ui-fe/src/app/service/python-test.service.ts`

Servicio que llama a los endpoints del backend.

#### 4. `nest-ui-fe/src/app/pages/python-tests/`

Componente completo con:

- `python-tests.component.ts` - Lógica
- `python-tests.component.html` - Template
- `python-tests.component.css` - Estilos

#### 5. `nest-ui-fe/src/app/app.routes.ts`

Ruta agregada: `/python-tests`

### Scripts Python

#### 6. `nest-files-py/`

Scripts de prueba:

- `test_all_libraries.py` - Verificar imports
- `test_numpy_pandas.py` - NumPy y Pandas
- `test_matplotlib.py` - Gráficos
- `test_opencv.py` - OpenCV
- `test_pillow.py` - Pillow
- `test_scipy.py` - SciPy
- `test_reportlab.py` - ReportLab
- `test_pypdf.py` - PyPDF
- `test_pymupdf.py` - PyMuPDF
- `quick_test.py` - Prueba rápida

## 🚀 Cómo Usar

### Opción 1: Desde la Interfaz (Recomendado)

1. **Iniciar la aplicación**:

   ```powershell
   # Terminal 1: Backend
   cd nest-ui-be
   npm run start:dev

   # Terminal 2: Frontend
   cd nest-ui-fe
   npm start

   # Terminal 3: Electron
   cd nest-electron
   npm run dev
   ```

2. **Navegar a la página de pruebas**:
   - Abrir la aplicación
   - Ir a: `http://localhost:4200/python-tests`
   - O agregar un botón en el navbar

3. **Ejecutar pruebas**:
   - Click en "▶️ Ejecutar Todas las Pruebas"
   - O ejecutar pruebas individuales

### Opción 2: Desde el Backend (API REST)

```bash
# Prueba rápida
curl http://localhost:3000/python/test/quick

# Verificar bibliotecas
curl http://localhost:3000/python/test/libraries

# Probar NumPy
curl http://localhost:3000/python/test/numpy

# Probar Pandas
curl http://localhost:3000/python/test/pandas

# Crear gráfico con Matplotlib
curl -X POST http://localhost:3000/python/test/matplotlib \
  -H "Content-Type: application/json" \
  -d '{"tipo":"lineas","outputPath":"grafico.png"}'

# Crear imagen con OpenCV
curl -X POST http://localhost:3000/python/test/opencv \
  -H "Content-Type: application/json" \
  -d '{"outputPath":"opencv.png"}'
```

### Opción 3: Desde Python Directamente

```powershell
cd nest-files-py
python quick_test.py
python test_numpy_pandas.py
python test_matplotlib.py lineas output/grafico.png
```

## 📊 Ejemplo de Respuesta

### GET /python/test/numpy

**Request**:

```http
GET http://localhost:3000/python/test/numpy
```

**Response**:

```json
{
  "success": true,
  "numpy_version": "1.26.2",
  "arrays": {
    "arr1": [1, 2, 3, 4, 5],
    "arr2": [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  },
  "operations": {
    "sum": 15,
    "mean": 3,
    "std": 1.4142135623730951,
    "max": 5,
    "min": 1,
    "matrix_sum": 45,
    "matrix_mean": 5
  },
  "random": {
    "normal": [98.5, 102.3, 95.7, ...],
    "uniform": [0.23, 0.87, 0.45, ...]
  }
}
```

## 🎨 Agregar Botón en el Navbar

Para acceder fácilmente a las pruebas, agrega un botón en el navbar:

### `nest-ui-fe/src/app/components/navbar/navbar.html`

```html
<nav class="navbar">
  <!-- ... otros botones ... -->

  <a routerLink="/python-tests" class="nav-link"> 🐍 Pruebas Python </a>
</nav>
```

## 🔧 Personalizar Pruebas

### Agregar Nueva Prueba

#### 1. Crear script Python

`nest-files-py/test_mi_biblioteca.py`:

```python
import json
import mi_biblioteca

def test_mi_funcion():
    resultado = mi_biblioteca.hacer_algo()
    return {
        "success": True,
        "resultado": resultado
    }

if __name__ == "__main__":
    print(json.dumps(test_mi_funcion()))
```

#### 2. Agregar método en el servicio

`nest-ui-be/src/python/python.service.ts`:

```typescript
async testMiBiblioteca(): Promise<any> {
  return this.executeScript('test_mi_biblioteca.py', []);
}
```

#### 3. Agregar endpoint en el controlador

`nest-ui-be/src/python/python.controller.ts`:

```typescript
@Get('test/mi-biblioteca')
async testMiBiblioteca() {
  try {
    return await this.pythonService.testMiBiblioteca();
  } catch (error) {
    throw new HttpException(
      {
        message: 'Error probando Mi Biblioteca',
        error: error.message || error,
        details: error,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
```

#### 4. Agregar método en el servicio Angular

`nest-ui-fe/src/app/service/python-test.service.ts`:

```typescript
testMiBiblioteca(): Observable<any> {
  return this.http.get(`${this.baseUrl}/mi-biblioteca`);
}
```

#### 5. Agregar en el componente

`nest-ui-fe/src/app/pages/python-tests/python-tests.component.ts`:

```typescript
tests: TestResult[] = [
  // ... otras pruebas ...
  { name: 'Mi Biblioteca', status: 'pending' }
];

// En runTest():
case 'Mi Biblioteca':
  result = await this.pythonTestService.testMiBiblioteca().toPromise();
  break;
```

## 🐛 Solución de Problemas

### Error: "Cannot find module 'xxx'"

**Problema**: La biblioteca no está instalada en el Python embebido.

**Solución**:

```powershell
cd nest-files-py-embedded
.\python.exe -m pip install xxx
```

### Error: "Bad magic number in .pyc"

**Problema**: Los archivos .pyc fueron compilados con otra versión de Python.

**Solución**:

```powershell
# Recompilar con el Python embebido
cd nest-files-py-embedded
.\python.exe ..\compile-python-scripts.py
```

### Error: "CORS policy"

**Problema**: El frontend no puede conectarse al backend.

**Solución**: Verifica que el backend esté corriendo en `http://localhost:3000`

### Error: "404 Not Found"

**Problema**: El endpoint no existe.

**Solución**: Verifica que el backend tenga el endpoint y esté corriendo.

## 📝 Notas Importantes

1. **Desarrollo vs Producción**:
   - Desarrollo: Scripts en `nest-files-py-embedded/`
   - Producción: Scripts en `resources/python/`

2. **Compilación**:
   - Los scripts `.py` se compilan a `.pyc` en producción
   - El servicio automáticamente busca `.pyc` si existe

3. **Seguridad**:
   - Los archivos `.pyc` tienen verificación de integridad
   - Los hashes se generan durante el build

4. **Rutas de Salida**:
   - Los archivos generados (PDFs, imágenes) se guardan en rutas relativas
   - Usa rutas absolutas para control total

## 🎯 Próximos Pasos

1. ✅ Scripts Python creados
2. ✅ Backend configurado
3. ✅ Frontend configurado
4. ✅ Rutas agregadas
5. 🔄 Agregar botón en navbar (opcional)
6. 🔄 Probar en desarrollo
7. 🔄 Compilar y probar en producción

## 📚 Referencias

- [NestJS Documentation](https://docs.nestjs.com/)
- [Angular Documentation](https://angular.io/docs)
- [Electron Documentation](https://www.electronjs.org/docs)
- Scripts Python: `nest-files-py/README_TESTS.md`
- Bibliotecas: `GUIAS/BIBLIOTECAS-PYTHON-EMBEBIDO.md`
