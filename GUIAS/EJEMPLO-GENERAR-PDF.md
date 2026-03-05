# 📄 Ejemplo Completo: Generar PDF

## ¿Por qué POST?

✅ **Usar POST cuando:**

- Creas o generas algo (PDF, archivo, registro)
- Envías datos complejos (objetos, arrays)
- La operación modifica el estado del sistema
- Envías datos sensibles

❌ **NO usar GET cuando:**

- Generas archivos
- Envías mucha información
- La operación tiene efectos secundarios

---

## 🎯 Ejemplo: Generar PDF Simple

### 1️⃣ Script Python

**Archivo:** `nest-files-py/generar_pdf.py`

```python
#!/usr/bin/env python3
"""
Genera un PDF simple con información proporcionada
"""

import sys
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import os

def generar_pdf(datos):
    """
    Genera un PDF con los datos proporcionados

    Args:
        datos (dict): Diccionario con la información del PDF
            - titulo: Título del documento
            - contenido: Texto del contenido
            - autor: Nombre del autor
            - nombre_archivo: Nombre del archivo a generar

    Returns:
        dict: Resultado de la operación
    """
    try:
        titulo = datos.get('titulo', 'Documento Sin Título')
        contenido = datos.get('contenido', '')
        autor = datos.get('autor', 'Anónimo')
        nombre_archivo = datos.get('nombre_archivo', 'documento.pdf')

        # Asegurar que termine en .pdf
        if not nombre_archivo.endswith('.pdf'):
            nombre_archivo += '.pdf'

        # Crear el PDF
        c = canvas.Canvas(nombre_archivo, pagesize=letter)
        width, height = letter

        # Título
        c.setFont("Helvetica-Bold", 24)
        c.drawString(1*inch, height - 1*inch, titulo)

        # Autor y fecha
        c.setFont("Helvetica", 10)
        c.drawString(1*inch, height - 1.3*inch, f"Autor: {autor}")
        c.drawString(1*inch, height - 1.5*inch, f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

        # Línea separadora
        c.line(1*inch, height - 1.7*inch, width - 1*inch, height - 1.7*inch)

        # Contenido
        c.setFont("Helvetica", 12)

        # Dividir contenido en líneas
        y_position = height - 2.2*inch
        max_width = width - 2*inch

        # Procesar el contenido línea por línea
        for linea in contenido.split('\n'):
            if y_position < 1*inch:
                c.showPage()
                y_position = height - 1*inch
                c.setFont("Helvetica", 12)

            # Dividir líneas largas
            palabras = linea.split(' ')
            linea_actual = ''

            for palabra in palabras:
                test_linea = linea_actual + palabra + ' '
                if c.stringWidth(test_linea, "Helvetica", 12) < max_width:
                    linea_actual = test_linea
                else:
                    if linea_actual:
                        c.drawString(1*inch, y_position, linea_actual.strip())
                        y_position -= 0.2*inch
                    linea_actual = palabra + ' '

            if linea_actual:
                c.drawString(1*inch, y_position, linea_actual.strip())
                y_position -= 0.2*inch

        # Guardar el PDF
        c.save()

        # Obtener ruta absoluta
        ruta_completa = os.path.abspath(nombre_archivo)

        return {
            "success": True,
            "mensaje": f"PDF generado exitosamente: {nombre_archivo}",
            "archivo": nombre_archivo,
            "ruta": ruta_completa,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "tipo_error": type(e).__name__
        }

def main():
    """Función principal"""
    try:
        # Verificar argumentos
        if len(sys.argv) < 2:
            print(json.dumps({
                "success": False,
                "error": "Se requiere un objeto JSON con los datos del PDF"
            }))
            sys.exit(1)

        # Parsear JSON de entrada
        datos_json = sys.argv[1]
        datos = json.loads(datos_json)

        # Generar PDF
        resultado = generar_pdf(datos)

        # Retornar resultado
        print(json.dumps(resultado, indent=2))

        # Salir con código apropiado
        sys.exit(0 if resultado.get("success") else 1)

    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "error": f"JSON inválido: {str(e)}"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**Instalar dependencia:**

```powershell
pip install reportlab
```

**Probar directamente:**

```powershell
$json = '{"titulo":"Mi Documento","contenido":"Este es el contenido del PDF","autor":"Juan Perez","nombre_archivo":"mi_documento.pdf"}'
py nest-files-py/generar_pdf.py $json$
```

---

### 2️⃣ Backend Service

**Archivo:** `nest-ui-be/src/python/python.service.ts`

Agregar en la sección de métodos:

```typescript
  /**
   * Genera un PDF con los datos proporcionados
   */
  async generarPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }): Promise<any> {
    const datosJson = JSON.stringify(datos);
    return this.executeScript('generar_pdf.py', [datosJson]);
  }
```

---

### 3️⃣ Backend Controller

**Archivo:** `nest-ui-be/src/python/python.controller.ts`

Agregar endpoint POST:

```typescript
  @Post('generar-pdf')
  async generarPDF(@Body() body: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }) {
    // Validar datos requeridos
    if (!body.titulo || !body.contenido) {
      throw new HttpException(
        'Título y contenido son requeridos',
        HttpStatus.BAD_REQUEST
      );
    }

    // Valores por defecto
    const datos = {
      titulo: body.titulo,
      contenido: body.contenido,
      autor: body.autor || 'Anónimo',
      nombre_archivo: body.nombre_archivo || 'documento.pdf'
    };

    return this.pythonService.generarPDF(datos);
  }
```

**Agregar imports si no están:**

```typescript
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
```

**Probar Backend:**

```powershell
$body = @{
    titulo = "Mi Documento"
    contenido = "Este es el contenido del PDF.`nPuede tener múltiples líneas.`n`nY párrafos separados."
    autor = "Juan Perez"
    nombre_archivo = "mi_documento.pdf"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/python/generar-pdf" -Method Post -Body $body -ContentType "application/json"
```

---

### 4️⃣ Electron API Client

**Archivo:** `nest-electron/src/api-client.ts`

```typescript
  static async pythonGenerarPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }): Promise<any> {
    return this.post("/python/generar-pdf", datos);
  }
```

---

### 5️⃣ Electron Main

**Archivo:** `nest-electron/src/main.ts`

```typescript
ipcMain.handle(
  "python:generar-pdf",
  async (
    _event,
    datos: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
    },
  ) => {
    const { ApiClient } = require("./api-client");
    return ApiClient.pythonGenerarPDF(datos);
  },
);
```

---

### 6️⃣ Electron Preload

**Archivo:** `nest-electron/src/preload.ts`

```typescript
    generarPDF: (datos: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
    }) => ipcRenderer.invoke("python:generar-pdf", datos),
```

---

### 7️⃣ Frontend Service - Interface

**Archivo:** `nest-ui-fe/src/app/service/electron.service.ts`

En la interface:

```typescript
generarPDF: (datos: {
  titulo: string;
  contenido: string;
  autor: string;
  nombre_archivo: string;
}) => Promise<any>;
```

---

### 8️⃣ Frontend Service - Método

**En el mismo archivo:**

```typescript
  async pythonGenerarPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }): Promise<any> {
    console.log('🟢 ElectronService.pythonGenerarPDF llamado:', datos);
    if (!this.isElectron) {
      throw new Error('No está corriendo en Electron');
    }
    console.log('🟢 Llamando a window.electronAPI.python.generarPDF...');
    const result = await window.electronAPI!.python.generarPDF(datos);
    console.log('🟢 Resultado:', result);
    return result;
  }
```

---

### 9️⃣ Frontend Component

**Archivo:** `nest-ui-fe/src/app/pages/home/home.ts`

```typescript
  async generarPDFEjemplo() {
    try {
      console.log('🧪 Generando PDF...');

      // Datos del PDF
      const datos = {
        titulo: 'Reporte de Producción',
        contenido: `Este es un reporte de ejemplo.

Sección 1: Introducción
Este documento fue generado automáticamente por el sistema.

Sección 2: Datos
- Item 1: Información importante
- Item 2: Más información
- Item 3: Datos adicionales

Sección 3: Conclusión
El proceso se completó exitosamente.`,
        autor: 'Sistema Automático',
        nombre_archivo: 'reporte_produccion.pdf'
      };

      // Llamar al servicio
      const result = await this.electronService.pythonGenerarPDF(datos);

      console.log('✅ Resultado:', result);

      if (result.success) {
        alert(`
✅ PDF Generado Exitosamente

📄 Archivo: ${result.archivo}
📁 Ruta: ${result.ruta}
⏰ ${result.timestamp}

${result.mensaje}
        `);
      } else {
        alert('❌ Error: ' + result.error);
      }

    } catch (error: any) {
      console.error('❌ Error:', error);
      alert('Error generando PDF: ' + error.message);
    }
  }
```

---

### 🔟 Frontend HTML

**Archivo:** `nest-ui-fe/src/app/pages/home/home.html`

```html
<app-button
  label="📄 Generar PDF"
  (click)="generarPDFEjemplo()"
  variant="primary"
/>
```

---

## 🎨 Versión Avanzada con Formulario

### Component con Inputs

```typescript
  // Signals para el formulario
  pdfTitulo = signal('');
  pdfContenido = signal('');
  pdfAutor = signal('');
  pdfNombreArchivo = signal('');
  isGeneratingPDF = signal(false);

  async generarPDFPersonalizado() {
    try {
      // Validar
      if (!this.pdfTitulo() || !this.pdfContenido()) {
        alert('Título y contenido son requeridos');
        return;
      }

      this.isGeneratingPDF.set(true);

      const datos = {
        titulo: this.pdfTitulo(),
        contenido: this.pdfContenido(),
        autor: this.pdfAutor() || 'Anónimo',
        nombre_archivo: this.pdfNombreArchivo() || 'documento.pdf'
      };

      const result = await this.electronService.pythonGenerarPDF(datos);

      if (result.success) {
        alert(`✅ ${result.mensaje}\n\n📁 ${result.ruta}`);

        // Limpiar formulario
        this.pdfTitulo.set('');
        this.pdfContenido.set('');
        this.pdfAutor.set('');
        this.pdfNombreArchivo.set('');
      } else {
        alert('❌ Error: ' + result.error);
      }

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      this.isGeneratingPDF.set(false);
    }
  }
```

### HTML con Formulario

```html
<div class="pdf-form">
  <h3>Generar PDF Personalizado</h3>

  <div class="form-group">
    <label>Título:</label>
    <input
      type="text"
      [(ngModel)]="pdfTitulo"
      placeholder="Título del documento"
    />
  </div>

  <div class="form-group">
    <label>Contenido:</label>
    <textarea
      [(ngModel)]="pdfContenido"
      placeholder="Contenido del documento"
      rows="10"
    ></textarea>
  </div>

  <div class="form-group">
    <label>Autor:</label>
    <input type="text" [(ngModel)]="pdfAutor" placeholder="Nombre del autor" />
  </div>

  <div class="form-group">
    <label>Nombre del archivo:</label>
    <input
      type="text"
      [(ngModel)]="pdfNombreArchivo"
      placeholder="documento.pdf"
    />
  </div>

  <app-button
    [label]="isGeneratingPDF() ? 'Generando...' : 'Generar PDF'"
    [disabled]="isGeneratingPDF()"
    (click)="generarPDFPersonalizado()"
    variant="primary"
  />
</div>
```

---

## 📊 Comparación GET vs POST

### GET - Para Consultas

```typescript
// ❌ NO usar GET para generar PDF
@Get('generar-pdf')
async generarPDF(@Query('titulo') titulo: string) {
  // Problemas:
  // - Datos limitados en URL
  // - No es semánticamente correcto
  // - Puede ser cacheado
  // - Datos visibles en logs
}
```

### POST - Para Crear/Generar ✅

```typescript
// ✅ Usar POST para generar PDF
@Post('generar-pdf')
async generarPDF(@Body() body: { titulo: string; contenido: string }) {
  // Ventajas:
  // - Datos complejos en body
  // - Semánticamente correcto
  // - No se cachea
  // - Datos no visibles en URL
}
```

---

## 🎯 Casos de Uso Reales

### 1. PDF de Reporte

```typescript
const datos = {
  titulo: "Reporte Mensual",
  contenido: `Ventas: $10,000\nGastos: $5,000\nGanancia: $5,000`,
  autor: "Sistema",
  nombre_archivo: "reporte_enero_2024.pdf",
};
```

### 2. PDF de Factura

```typescript
const datos = {
  titulo: "Factura #001",
  contenido: `Cliente: Juan Perez\nTotal: $500\nFecha: 2024-01-20`,
  autor: "Sistema de Facturación",
  nombre_archivo: "factura_001.pdf",
};
```

### 3. PDF de Certificado

```typescript
const datos = {
  titulo: "Certificado de Participación",
  contenido: `Se certifica que Juan Perez participó en el curso...`,
  autor: "Institución Educativa",
  nombre_archivo: "certificado_juan_perez.pdf",
};
```

---

## ✅ Checklist

- [ ] Instalar reportlab: `pip install reportlab`
- [ ] Crear script Python
- [ ] Probar script directamente
- [ ] Agregar método en Service
- [ ] Agregar endpoint POST en Controller
- [ ] Probar Backend
- [ ] Agregar en API Client
- [ ] Agregar handler en Main
- [ ] Agregar en Preload
- [ ] Agregar interface en Electron Service
- [ ] Agregar método en Electron Service
- [ ] Agregar método en Component
- [ ] Agregar botón/formulario en HTML
- [ ] Recompilar Electron
- [ ] Probar en la app

---

**¡Listo!** Ahora puedes generar PDFs desde tu aplicación. 🎉
