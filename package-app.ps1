# package-app.ps1
# Script completo para empaquetar la aplicacion en produccion

Write-Host "[PACKAGE] Iniciando empaquetado de produccion..." -ForegroundColor Cyan

# Limpiar builds anteriores
Write-Host "[CLEAN] Limpiando builds anteriores..." -ForegroundColor Yellow
Remove-Item -Path "nest-ui-be/dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "nest-ui-fe/dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "nest-electron/dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "nest-electron/release" -Recurse -Force -ErrorAction SilentlyContinue

# Compilar Backend
Write-Host "[BUILD] Compilando Backend..." -ForegroundColor Cyan
cd nest-ui-be
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error compilando Backend" -ForegroundColor Red
    cd ..
    exit 1
}

# Compilar Frontend
Write-Host "[BUILD] Compilando Frontend..." -ForegroundColor Cyan
cd ../nest-ui-fe
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error compilando Frontend" -ForegroundColor Red
    cd ..
    exit 1
}

# Empaquetar Electron
Write-Host "[PACKAGE] Empaquetando Electron..." -ForegroundColor Cyan
cd ../nest-electron
npm run dist:win

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error empaquetando Electron" -ForegroundColor Red
    cd ..
    exit 1
}

Write-Host "[SUCCESS] Empaquetado completo!" -ForegroundColor Green
Write-Host "[INFO] Instalador creado en: nest-electron/release/" -ForegroundColor Green

# Mostrar informacion del instalador
$installer = Get-ChildItem -Path "release" -Filter "*.exe" | Select-Object -First 1
if ($installer) {
    $sizeMB = [math]::Round($installer.Length / 1MB, 2)
    Write-Host "[INFO] Archivo: $($installer.Name)" -ForegroundColor Cyan
    Write-Host "[INFO] Tamano: $sizeMB MB" -ForegroundColor Cyan
}

cd ..
