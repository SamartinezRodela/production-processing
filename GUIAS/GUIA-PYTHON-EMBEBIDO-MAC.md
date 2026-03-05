# Guía: Python Embebido en Mac - Sin Instalación para el Usuario

Esta guía te muestra cómo incluir Python + todas las bibliotecas dentro de tu aplicación Electron para Mac, para que el usuario final NO tenga que instalar Python ni bibliotecas.

## 📋 Resumen

- ✅ Usuario descarga tu DMG
- ✅ Usuario arrastra la app a Aplicaciones
- ✅ Python + bibliotecas YA están incluidas
- ✅ Todo funciona sin instalar nada más

---

## 🎯 Paso 1: Preparar Python Embebido en Mac

### 1.1 Instalar Python en Mac (para preparar el embebido)

```bash
# Verificar si ya tienes Python 3
python3 --version

# Si no tienes Python 3, instalar con Homebrew
brew install python@3.11
```

### 1.2 Crear entorno virtual para embebed

```bash
cd ~/Projects/NEST-UI-V2

# Crear carpeta para Python embebido
mkdir -p nest-files-py-embedded-mac

# Crear entorno virtual
python3 -m venv nest-files-py-embedded-mac/python-runtime

# Activar el entorno
source nest-files-py-embedded-mac/python-runtime/bin/activate
```

---

## 📦 Paso 2: Instalar Bibliotecas

### 2.1 Crear requirements.txt

**Archivo:** `nest-files-py-embedded-mac/requirements.txt`

```txt
pypdf
pillow
reportlab
openpyxl
requests
pandas
numpy
```

### 2.2 Instalar todas las bibliotecas

```bash
# Asegúrate de estar en el entorno virtual activado
cd nest-files-py-embedded-mac

# Instalar bibliotecas
pip install -r requirements.txt

# Verificar instalación
pip list
```

---

## 📁 Paso 3: Copiar Scripts Python

```bash
# Copiar tus scripts Python
cp -r ../nest-files-py/*.py .

# Verificar estructura
ls -la
```

Estructura esperada:

```
nest-files-py-embedded-mac/
  ├── python-runtime/
  │   ├── bin/
  │   │   ├── python3
  │   │   ├── pip
  │   │   └── activate
  │   └── lib/
  │       └── python3.11/
  │           └── site-packages/
  │               ├── PIL/
  │               ├── pypdf/
  │               ├── reportlab/
  │               └── ...
  ├── generar_pdf.py
  ├── verify_folder.py
  ├── calculate_stats.py
  └── requirements.txt
```

---

## 🧪 Paso 4: Probar que Funciona

```bash
cd nest-files-py-embedded-mac

# Activar entorno
source python-runtime/bin/activate

# Probar scripts
python generar_pdf.py
python calculate_stats.py '{"numbers": [1, 2, 3, 4, 5]}'

# Desactivar entorno
deactivate
```

---

## ⚙️ Paso 5: Configurar Electron Builder para Mac

### 5.1 Actualizar package.json

**Archivo:** `nest-electron/package.json`

```json
{
  "build": {
    "mac": {
      "target": ["dmg"],
      "category": "public.app-category.productivity",
      "icon": "assets/icon.icns"
    },
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
        "from": "../nest-files-py-embedded-mac",
        "to": "python",
        "filter": ["**/*"]
      }
    ]
  }
}
```

---

## 🔄 Paso 6: Actualizar Backend para Mac

### 6.1 Actualizar python.service.ts

**Archivo:** `nest-ui-be/src/python/python.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name);

  private getPythonPath(): string {
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.resourcesPath !== undefined;

    if (isProduction) {
      const resourcesPath = process.resourcesPath;
      const pythonDir = path.join(resourcesPath, "python");

      // Detectar sistema operativo
      const isMac = process.platform === "darwin";
      const isWindows = process.platform === "win32";

      if (isMac) {
        // En Mac, usar el Python del venv
        const pythonExe = path.join(
          pythonDir,
          "python-runtime",
          "bin",
          "python3",
        );
        this.logger.log(`Modo PRODUCCIÓN (Mac) - Python: ${pythonExe}`);
        return pythonExe;
      } else if (isWindows) {
        // En Windows, usar python.exe
        const pythonExe = path.join(pythonDir, "python.exe");
        this.logger.log(`Modo PRODUCCIÓN (Windows) - Python: ${pythonExe}`);
        return pythonExe;
      }
    }

    // Modo desarrollo
    const isMac = process.platform === "darwin";
    if (isMac) {
      const devPath = path.resolve(
        __dirname,
        "../../../nest-files-py-embedded-mac/python-runtime/bin/python3",
      );
      this.logger.log(`Modo DESARROLLO (Mac) - Python: ${devPath}`);
      return devPath;
    } else {
      const devPath = path.resolve(
        __dirname,
        "../../../nest-files-py-embedded/python.exe",
      );
      this.logger.log(`Modo DESARROLLO (Windows) - Python: ${devPath}`);
      return devPath;
    }
  }

  private getPythonScriptsPath(): string {
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.resourcesPath !== undefined;

    if (isProduction) {
      const prodPath = path.join(process.resourcesPath, "python");
      this.logger.log(`Scripts path: ${prodPath}`);
      return prodPath;
    } else {
      const isMac = process.platform === "darwin";
      const devPath = isMac
        ? path.resolve(__dirname, "../../../nest-files-py-embedded-mac")
        : path.resolve(__dirname, "../../../nest-files-py-embedded");
      this.logger.log(`Scripts path: ${devPath}`);
      return devPath;
    }
  }

  private async executePythonScript(
    scriptName: string,
    args: string[] = [],
  ): Promise<string> {
    const pythonExe = this.getPythonPath();
    const scriptsPath = this.getPythonScriptsPath();
    const scriptPath = path.join(scriptsPath, scriptName);

    // Verificar que existen
    if (!fs.existsSync(pythonExe)) {
      throw new Error(`Python no encontrado: ${pythonExe}`);
    }
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script no encontrado: ${scriptPath}`);
    }

    this.logger.log(`Ejecutando: ${pythonExe} ${scriptPath}`);

    return new Promise((resolve, reject) => {
      const process = spawn(pythonExe, [scriptPath, ...args]);

      let output = "";
      let errorOutput = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      process.on("close", (code) => {
        if (code !== 0) {
          this.logger.error(`Python error (code ${code}): ${errorOutput}`);
          reject(new Error(`Python error: ${errorOutput}`));
        } else {
          resolve(output);
        }
      });

      process.on("error", (error) => {
        this.logger.error(`Error al ejecutar Python: ${error.message}`);
        reject(error);
      });
    });
  }

  // Tus métodos existentes aquí...
  async generatePdf(data: any): Promise<string> {
    const jsonData = JSON.stringify(data);
    return this.executePythonScript("generar_pdf.py", [jsonData]);
  }

  async calculateStats(numbers: number[]): Promise<any> {
    const jsonData = JSON.stringify({ numbers });
    const result = await this.executePythonScript("calculate_stats.py", [
      jsonData,
    ]);
    return JSON.parse(result);
  }
}
```

---

## 🏗️ Paso 7: Compilar desde Windows para Mac

### 7.1 En Windows: Preparar archivos

```powershell
cd C:\Projects\NEST-UI-V2

# Compilar Frontend
cd nest-ui-fe
npm run build

# Compilar Backend
cd ..\nest-ui-be
npm run build

# Compilar Electron
cd ..\nest-electron
npm run build

# Preparar para transferencia
cd ..
New-Item -ItemType Directory -Force -Path ..\NEST-UI-V2-MAC
Copy-Item -Recurse nest-ui-fe\dist ..\NEST-UI-V2-MAC\nest-ui-fe-dist
Copy-Item -Recurse nest-ui-be\dist ..\NEST-UI-V2-MAC\nest-ui-be-dist
Copy-Item -Recurse nest-electron\dist ..\NEST-UI-V2-MAC\nest-electron-dist
Copy-Item nest-electron\package*.json ..\NEST-UI-V2-MAC\
Copy-Item -Recurse nest-electron\src ..\NEST-UI-V2-MAC\src

# Copiar scripts Python (sin el embebido de Windows)
Copy-Item -Recurse nest-files-py ..\NEST-UI-V2-MAC\nest-files-py

# Comprimir
cd ..
Compress-Archive -Path NEST-UI-V2-MAC -DestinationPath NEST-UI-V2-MAC.zip -Force
```

### 7.2 Transferir a Mac (USB, nube, etc.)

---

## 🍎 Paso 8: En Mac - Crear Python Embebido y Compilar

### 8.1 Descomprimir y preparar

```bash
cd ~/Downloads
unzip NEST-UI-V2-MAC.zip
cd NEST-UI-V2-MAC

# Crear Python embebido
mkdir -p nest-files-py-embedded-mac
cd nest-files-py-embedded-mac

# Crear entorno virtual
python3 -m venv python-runtime

# Activar
source python-runtime/bin/activate

# Crear requirements.txt
cat > requirements.txt << EOF
pypdf
pillow
reportlab
openpyxl
requests
pandas
numpy
EOF

# Instalar bibliotecas
pip install -r requirements.txt

# Copiar scripts Python
cp ../nest-files-py/*.py .

# Desactivar
deactivate

cd ..
```

### 8.2 Reorganizar archivos

```bash
# Crear estructura correcta
mkdir -p ../nest-ui-fe/dist/nest-ui-fe/browser
mkdir -p ../nest-ui-be/dist
mkdir -p nest-electron

# Mover archivos
mv nest-ui-fe-dist/* ../nest-ui-fe/dist/nest-ui-fe/browser/
mv nest-ui-be-dist/* ../nest-ui-be/dist/
mv nest-electron-dist/* nest-electron/dist/
mv package*.json nest-electron/
mv src nest-electron/

# Mover Python embebido a la ubicación correcta
mv nest-files-py-embedded-mac ../

cd nest-electron
```

### 8.3 Instalar dependencias y compilar

```bash
# Instalar dependencias de Electron
npm install

# Crear DMG
npm run dist:mac
```

---

## 🎉 Paso 9: Verificar el DMG

```bash
# El DMG está en:
ls -lh release/*.dmg

# Montar el DMG para verificar
hdiutil attach release/*.dmg

# Verificar contenido
ls -la /Volumes/*/Production\ Processing.app/Contents/Resources/python/

# Deberías ver:
# python-runtime/
#   ├── bin/
#   │   └── python3
#   └── lib/
#       └── python3.11/
#           └── site-packages/
# generar_pdf.py
# calculate_stats.py
# ...

# Desmontar
hdiutil detach /Volumes/Production*
```

---

## 🧪 Paso 10: Probar la Aplicación

```bash
# Instalar la app
open release/*.dmg
# Arrastra la app a Aplicaciones

# Ejecutar
open /Applications/Production\ Processing.app

# Probar funciones que usan Python
# ✅ Debería funcionar sin pedir instalar Python
```

---

## 🐛 Solución de Problemas

### Problema: "python3: command not found"

```bash
# Verificar ruta en la app instalada
ls -la /Applications/Production\ Processing.app/Contents/Resources/python/python-runtime/bin/

# Verificar permisos
chmod +x /Applications/Production\ Processing.app/Contents/Resources/python/python-runtime/bin/python3
```

### Problema: "ModuleNotFoundError"

```bash
# Reinstalar bibliotecas en el venv
cd nest-files-py-embedded-mac
source python-runtime/bin/activate
pip install --force-reinstall pypdf pillow reportlab
deactivate
```

### Problema: "Permission denied" al ejecutar Python

```bash
# Dar permisos de ejecución
chmod +x nest-files-py-embedded-mac/python-runtime/bin/*
```

### Problema: DMG muy grande

```bash
# Verificar tamaño
du -sh nest-files-py-embedded-mac/

# Limpiar caché de pip
cd nest-files-py-embedded-mac/python-runtime
rm -rf lib/python3.*/site-packages/pip*
rm -rf lib/python3.*/site-packages/setuptools*
```

---

## 📊 Comparación Windows vs Mac

| Aspecto                 | Windows                       | Mac                        |
| ----------------------- | ----------------------------- | -------------------------- |
| Python embebido         | python-3.11.x-embed-amd64.zip | python3 -m venv            |
| Ejecutable              | python.exe                    | python-runtime/bin/python3 |
| Tamaño típico           | ~150-200 MB                   | ~180-250 MB                |
| Instalación bibliotecas | pip en embebido               | pip en venv                |
| Preparación             | En Windows                    | Debe hacerse en Mac        |

---

## ✅ Checklist Final para Mac

- [ ] Python 3 instalado en Mac (para preparar)
- [ ] Entorno virtual creado
- [ ] Todas las bibliotecas instaladas
- [ ] Scripts Python copiados
- [ ] Scripts probados con venv
- [ ] `package.json` configurado correctamente
- [ ] Backend actualizado con rutas Mac
- [ ] DMG compilado
- [ ] DMG probado en Mac limpio
- [ ] Funciones Python probadas en producción

---

## 🚀 Script Automatizado para Mac

Crea este script para automatizar el proceso:

**Archivo:** `prepare-python-mac.sh`

```bash
#!/bin/bash

echo "🍎 Preparando Python embebido para Mac..."

# Crear carpeta
mkdir -p nest-files-py-embedded-mac
cd nest-files-py-embedded-mac

# Crear venv
echo "📦 Creando entorno virtual..."
python3 -m venv python-runtime

# Activar
source python-runtime/bin/activate

# Crear requirements.txt
cat > requirements.txt << EOF
pypdf
pillow
reportlab
openpyxl
requests
pandas
numpy
EOF

# Instalar
echo "📥 Instalando bibliotecas..."
pip install -r requirements.txt

# Copiar scripts
echo "📁 Copiando scripts..."
cp ../nest-files-py/*.py .

# Desactivar
deactivate

echo "✅ Python embebido listo!"
echo "📍 Ubicación: nest-files-py-embedded-mac/"

cd ..
```

Uso:

```bash
chmod +x prepare-python-mac.sh
./prepare-python-mac.sh
```

---

## 📝 Resumen del Flujo Completo

### En Windows:

1. Compilar Frontend, Backend, Electron
2. Preparar archivos (sin Python embebido)
3. Transferir a Mac

### En Mac:

1. Crear Python embebido con venv
2. Instalar bibliotecas
3. Copiar scripts Python
4. Reorganizar archivos
5. Compilar DMG

### Usuario Final:

1. Descarga DMG
2. Arrastra a Aplicaciones
3. ✅ Todo funciona sin instalar Python

---

## 💡 Consejos Importantes

1. **El venv debe crearse en Mac** - No puedes crear el venv en Windows y transferirlo
2. **Bibliotecas nativas** - Algunas bibliotecas (como numpy, pillow) tienen componentes nativos que deben compilarse en Mac
3. **Tamaño** - El DMG será más grande (~200-300 MB) pero es autocontenido
4. **Permisos** - Asegúrate de que python3 tenga permisos de ejecución
5. **Testing** - Siempre prueba en un Mac limpio antes de distribuir

---

## 🎯 Resultado Final

El usuario de Mac:

1. Descarga: `Production Processing.dmg`
2. Arrastra a Aplicaciones
3. Ejecuta la app
4. ✅ NO instala Python
5. ✅ NO instala bibliotecas
6. ✅ NO configura nada

¡Tu aplicación es completamente autocontenida en Mac!
