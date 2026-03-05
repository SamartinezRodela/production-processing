# Guía: Python Embebido - Usuario NO Instala Nada

Esta guía te muestra cómo incluir Python + todas las bibliotecas dentro de tu aplicación Electron para que el usuario final NO tenga que instalar Python ni bibliotecas.

## 📋 Resumen

- ✅ Usuario descarga tu instalador
- ✅ Usuario instala tu app
- ✅ Python + bibliotecas YA están incluidas
- ✅ Todo funciona sin instalar nada más

---

## 🎯 Paso 1: Descargar Python Embeddable

### 1.1 Descarga Python Embeddable

1. Ve a: https://www.python.org/downloads/windows/
2. Busca la versión que necesitas (ej: Python 3.11.x)
3. Descarga: **Windows embeddable package (64-bit)**
   - Archivo: `python-3.11.x-embed-amd64.zip`

### 1.2 Extrae en tu proyecto

```powershell
# Crea la carpeta si no existe
New-Item -ItemType Directory -Path "nest-files-py-embedded" -Force

# Extrae el ZIP descargado aquí
# Deberías tener:
# nest-files-py-embedded/
#   ├── python.exe
#   ├── python311.dll
#   ├── python311.zip
#   └── ...
```

---

## 🔧 Paso 2: Configurar pip en Python Embeddable

Python embeddable NO trae pip por defecto. Necesitas instalarlo:

### 2.1 Descargar get-pip.py

```powershell
cd nest-files-py-embedded

# Descarga get-pip.py
Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile "get-pip.py"
```

### 2.2 Habilitar site-packages

Edita el archivo `python311._pth` (el número puede variar según tu versión):

```powershell
# Abre el archivo
notepad python311._pth
```

Descomenta o agrega esta línea (quita el # si existe):

```
import site
```

Debería verse así:

```
python311.zip
.
import site
```

### 2.3 Instalar pip

```powershell
# Instala pip
./python.exe get-pip.py
```

---

## 📦 Paso 3: Instalar Bibliotecas

Ahora instala TODAS las bibliotecas que usan tus scripts Python:

### 3.1 Crea requirements.txt

Primero, identifica qué bibliotecas usas. Crea un archivo:

**Archivo:** `nest-files-py-embedded/requirements.txt`

```txt
pypdf
pillow
reportlab
openpyxl
requests
pandas
numpy
```

### 3.2 Instala las bibliotecas

```powershell
cd nest-files-py-embedded

# Instala todas las bibliotecas
./python.exe -m pip install -r requirements.txt

# Verifica que se instalaron
./python.exe -m pip list
```

Deberías ver todas tus bibliotecas listadas.

---

## 📁 Paso 4: Copiar tus Scripts Python

Copia tus scripts `.py` a la carpeta embebida:

```powershell
# Copia todos tus scripts
Copy-Item -Path "nest-files-py/*.py" -Destination "nest-files-py-embedded/" -Recurse
```

Estructura final:

```
nest-files-py-embedded/
  ├── python.exe
  ├── python311.dll
  ├── Lib/
  │   └── site-packages/
  │       ├── PIL/
  │       ├── pypdf/
  │       ├── reportlab/
  │       └── ...
  ├── Scripts/
  │   └── pip.exe
  ├── generar_pdf.py          ← Tus scripts
  ├── verify_folder.py        ← Tus scripts
  ├── calculate_stats.py      ← Tus scripts
  └── requirements.txt
```

---

## 🧪 Paso 5: Probar que Funciona

Prueba que tus scripts funcionan con el Python embebido:

```powershell
cd nest-files-py-embedded

# Prueba un script
./python.exe generar_pdf.py

# Prueba otro
./python.exe calculate_stats.py '{"numbers": [1, 2, 3, 4, 5]}'
```

Si funciona aquí, funcionará en producción.

---

## ⚙️ Paso 6: Configurar Electron Builder

Actualiza `nest-electron/package.json` para incluir Python embebido:

### 6.1 Edita package.json

```json
{
  "build": {
    "extraResources": [
      {
        "from": "../nest-ui-fe/dist/nest-ui-fe/browser",
        "to": "frontend",
        "filter": ["**/*"]
      },
      {
        "from": "../nest-ui-be/dist",
        "to": "backend/dist",
        "filter": ["**/*"]
      },
      {
        "from": "../nest-ui-be/node_modules",
        "to": "backend/node_modules",
        "filter": ["**/*"]
      },
      {
        "from": "../nest-ui-be/package.json",
        "to": "backend/package.json"
      },
      {
        "from": "../nest-files-py-embedded",
        "to": "python",
        "filter": ["**/*"]
      }
    ]
  }
}
```

**Cambio importante:**

- ❌ Antes: `"from": "../nest-files-py"` (solo scripts)
- ✅ Ahora: `"from": "../nest-files-py-embedded"` (Python completo + bibliotecas)

---

## 🔄 Paso 7: Actualizar Servicios Backend

Tus servicios ya están configurados correctamente, pero verifica:

### 7.1 Verifica python.service.ts

**Archivo:** `nest-ui-be/src/python/python.service.ts`

```typescript
private getPythonScriptsPath(): string {
  const isProduction = process.env.NODE_ENV === 'production' ||
                       process.resourcesPath !== undefined;

  if (isProduction) {
    const prodPath = path.join(process.resourcesPath, 'python');
    this.logger.log(`Modo PRODUCCIÓN - Scripts path: ${prodPath}`);
    return prodPath;
  } else {
    // En desarrollo, usa nest-files-py-embedded
    const devPath = path.resolve(__dirname, '../../../nest-files-py-embedded');
    this.logger.log(`Modo DESARROLLO - Scripts path: ${devPath}`);
    return devPath;
  }
}
```

### 7.2 Actualiza cómo ejecutas Python

Asegúrate de usar `python.exe` del embebido:

```typescript
private async executePythonScript(
  scriptName: string,
  args: string[] = [],
): Promise<string> {
  const scriptsPath = this.getPythonScriptsPath();
  const scriptPath = path.join(scriptsPath, scriptName);

  // Usa python.exe del embebido
  const pythonExe = path.join(scriptsPath, 'python.exe');

  return new Promise((resolve, reject) => {
    const process = spawn(pythonExe, [scriptPath, ...args]);

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python error: ${errorOutput}`));
      } else {
        resolve(output);
      }
    });
  });
}
```

---

## 🏗️ Paso 8: Compilar la Aplicación

### 8.1 Compila todo

```powershell
# Desde la raíz del proyecto

# 1. Compila Frontend
cd nest-ui-fe
npm run build

# 2. Compila Backend
cd nest-ui-be
npm run build

# 3. Compila Electron y crea instalador
cd ../nest-electron
npm run dist:win
```

### 8.2 Verifica el resultado

```powershell
cd nest-electron/release/win-unpacked/resources

# Deberías ver:
dir python

# Contenido:
# python/
#   ├── python.exe          ✅
#   ├── python311.dll       ✅
#   ├── Lib/                ✅
#   │   └── site-packages/  ✅
#   ├── generar_pdf.py      ✅
#   └── ...
```

---

## 🎉 Paso 9: Probar el Instalador

### 9.1 Instala en otra PC (o desinstala y reinstala)

```powershell
# El instalador está en:
nest-electron/release/Production Processing Setup 1.0.0.exe
```

### 9.2 Verifica que funciona

1. Instala la aplicación
2. Ejecuta la aplicación
3. Prueba las funciones que usan Python
4. ✅ Debería funcionar sin instalar Python

---

## 🐛 Solución de Problemas

### Problema: "python.exe no encontrado"

```typescript
// Verifica la ruta en logs
console.log(
  "Python path:",
  path.join(process.resourcesPath, "python", "python.exe"),
);
```

### Problema: "ModuleNotFoundError: No module named 'pypdf'"

```powershell
# Reinstala las bibliotecas
cd nest-files-py-embedded
./python.exe -m pip install --force-reinstall pypdf pillow reportlab
```

### Problema: "DLL load failed"

Algunas bibliotecas necesitan Visual C++ Redistributable:

- Descarga: https://aka.ms/vs/17/release/vc_redist.x64.exe
- Inclúyelo en tu instalador o pide al usuario instalarlo

### Problema: Instalador muy grande

```powershell
# Verifica el tamaño
dir nest-electron/release/*.exe

# Tamaño esperado:
# - Con Python embebido: 150-250 MB
# - Sin Python: 80-120 MB
```

Es normal que sea más grande, incluye Python completo.

---

## 📊 Comparación

| Aspecto                     | Antes   | Después |
| --------------------------- | ------- | ------- |
| Usuario instala Python      | ❌ Sí   | ✅ No   |
| Usuario instala bibliotecas | ❌ Sí   | ✅ No   |
| Tamaño instalador           | ~100 MB | ~200 MB |
| Funciona offline            | ❌ No   | ✅ Sí   |
| Versión Python garantizada  | ❌ No   | ✅ Sí   |

---

## ✅ Checklist Final

Antes de distribuir tu aplicación:

- [ ] Python embeddable descargado y extraído
- [ ] pip instalado en Python embebido
- [ ] Todas las bibliotecas instaladas (`pip list`)
- [ ] Scripts Python copiados a carpeta embebida
- [ ] Scripts probados con Python embebido
- [ ] `package.json` actualizado con nueva ruta
- [ ] Servicios backend actualizados
- [ ] Aplicación compilada (`npm run dist:win`)
- [ ] Instalador probado en PC limpia
- [ ] Funciones Python probadas en producción

---

## 🚀 Comandos Rápidos

```powershell
# Setup inicial (una sola vez)
cd nest-files-py-embedded
./python.exe get-pip.py
./python.exe -m pip install -r requirements.txt

# Compilar aplicación
cd nest-electron
npm run dist:win

# Probar instalador
./release/Production\ Processing\ Setup\ 1.0.0.exe
```

---

## 📝 Notas Importantes

1. **Tamaño:** El instalador será más grande (~200MB) pero el usuario NO necesita instalar nada
2. **Versión:** Siempre usarás la misma versión de Python (la embebida)
3. **Bibliotecas:** Las bibliotecas están "congeladas" en la versión que instalaste
4. **Actualizaciones:** Para actualizar bibliotecas, reinstálalas en `nest-files-py-embedded` y recompila

---

## 🎯 Resultado Final

El usuario:

1. Descarga: `Production Processing Setup 1.0.0.exe`
2. Instala: Click, click, listo
3. Ejecuta: Todo funciona
4. ✅ NO instala Python
5. ✅ NO instala bibliotecas
6. ✅ NO configura nada

¡Tu aplicación es completamente autocontenida!
