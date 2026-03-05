# create-mac-package.ps1
# Script para crear un ZIP con solo lo necesario para compilar en Mac

Write-Host "[ZIP] Creando paquete para Mac..." -ForegroundColor Cyan

$zipName = "proyecto-para-mac.zip"
$tempFolder = "temp-mac-package"

# Limpiar carpeta temporal si existe
if (Test-Path $tempFolder) {
    Remove-Item -Path $tempFolder -Recurse -Force
}

# Crear carpeta temporal
New-Item -ItemType Directory -Path $tempFolder | Out-Null

Write-Host "[COPY] Copiando archivos necesarios..." -ForegroundColor Yellow

# Copiar carpetas de código fuente (sin node_modules ni dist)
Write-Host "  - Copiando nest-ui-be (sin node_modules)..." -ForegroundColor Gray
robocopy nest-ui-be "$tempFolder/nest-ui-be" /E /XD node_modules /NFL /NDL /NJH /NJS

Write-Host "  - Copiando nest-ui-fe (sin node_modules)..." -ForegroundColor Gray
robocopy nest-ui-fe "$tempFolder/nest-ui-fe" /E /XD node_modules /NFL /NDL /NJH /NJS

Write-Host "  - Copiando nest-electron (sin release)..." -ForegroundColor Gray
robocopy nest-electron "$tempFolder/nest-electron" /E /XD release /NFL /NDL /NJH /NJS

Write-Host "  - Copiando nest-files-py..." -ForegroundColor Gray
robocopy nest-files-py "$tempFolder/nest-files-py" /E /NFL /NDL /NJH /NJS

# IMPORTANTE: Copiar Python embebido de Windows (se adaptará para Mac)
if (Test-Path "nest-files-py-embedded") {
    Write-Host "  - Copiando Python embebido..." -ForegroundColor Gray
    robocopy nest-files-py-embedded "$tempFolder/nest-files-py-embedded" /E /NFL /NDL /NJH /NJS
}

# Copiar Base_Files si existe
if (Test-Path "Base_Files") {
    Write-Host "  - Copiando Base_Files..." -ForegroundColor Gray
    robocopy Base_Files "$tempFolder/Base_Files" /E /NFL /NDL /NJH /NJS
}

# Copiar scripts de Mac
Write-Host "  - Copiando scripts de Mac..." -ForegroundColor Gray
Copy-Item -Path "build-mac.sh" -Destination "$tempFolder/" -ErrorAction SilentlyContinue
Copy-Item -Path "setup-mac.sh" -Destination "$tempFolder/" -ErrorAction SilentlyContinue
Copy-Item -Path "create-dmg.sh" -Destination "$tempFolder/" -ErrorAction SilentlyContinue
Copy-Item -Path "create-dmg-simple.sh" -Destination "$tempFolder/" -ErrorAction SilentlyContinue
Copy-Item -Path "prepare-python-mac.sh" -Destination "$tempFolder/" -ErrorAction SilentlyContinue

# Copiar package.json de raíz si existe
if (Test-Path "package.json") {
    Copy-Item -Path "package.json" -Destination "$tempFolder/"
}

# Copiar guías importantes
Write-Host "  - Copiando guías..." -ForegroundColor Gray
Copy-Item -Path "GUIA-*.md" -Destination "$tempFolder/" -ErrorAction SilentlyContinue

# Crear archivo README para Mac
$readmeContent = @"
# Instrucciones para crear DMG en Mac

## MÉTODO RECOMENDADO: Modo Simplificado ✅

Si ya compilaste en Windows con .\build-all.ps1:

``````bash
# 1. Dar permisos
chmod +x *.sh

# 2. Crear DMG (instala lo mínimo necesario automáticamente)
./create-dmg-simple.sh
``````

**Requiere en Mac:**
- ✅ Node.js (solo para electron-builder)
- ✅ Python 3.11 (solo para crear Python embebido)

**Tiempo:** ~5 minutos

---

## MÉTODO ALTERNATIVO: Compilación Completa

Si quieres compilar todo desde cero en Mac:

``````bash
chmod +x *.sh
./setup-mac.sh
./prepare-python-mac.sh
./build-mac.sh
``````

**Tiempo:** ~15 minutos

---

## Instalación de requisitos en Mac:

``````bash
# Instalar Homebrew (si no lo tiene)
/bin/bash -c "`$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node

# Instalar Python
brew install python@3.11
``````

---

## Resultado:

``````
nest-electron/release/Production Processing-1.0.0.dmg
``````

---

## ¿Qué necesita la Mac del usuario final?

**NADA.** La aplicación incluye:
- ✅ Node.js embebido (de Electron)
- ✅ Python embebido
- ✅ Todas las dependencias

El usuario solo instala el DMG y listo.
"@

Set-Content -Path "$tempFolder/README-MAC.txt" -Value $readmeContent

# Crear el ZIP
Write-Host "[ZIP] Comprimiendo archivos..." -ForegroundColor Cyan
if (Test-Path $zipName) {
    Remove-Item -Path $zipName -Force
}

Compress-Archive -Path "$tempFolder/*" -DestinationPath $zipName -CompressionLevel Optimal

# Limpiar carpeta temporal
Remove-Item -Path $tempFolder -Recurse -Force

# Mostrar información
$zipSize = [math]::Round((Get-Item $zipName).Length / 1MB, 2)

Write-Host ""
Write-Host "[SUCCESS] Paquete creado exitosamente!" -ForegroundColor Green
Write-Host "[INFO] Archivo: $zipName" -ForegroundColor Cyan
Write-Host "[INFO] Tamaño: $zipSize MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "[NEXT] Pasos siguientes:" -ForegroundColor Yellow
Write-Host "  1. Transferir $zipName a Mac (USB, email, etc.)" -ForegroundColor White
Write-Host "  2. Descomprimir en Mac" -ForegroundColor White
Write-Host "  3. Seguir instrucciones en README-MAC.txt" -ForegroundColor White
Write-Host ""
