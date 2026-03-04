# build-all.ps1
# Script para compilar Backend, Frontend y Electron

Write-Host "[BUILD] Compilando Backend..." -ForegroundColor Cyan
cd nest-ui-be
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error compilando Backend" -ForegroundColor Red
    cd ..
    exit 1
}

Write-Host "[BUILD] Compilando Frontend..." -ForegroundColor Cyan
cd ../nest-ui-fe
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error compilando Frontend" -ForegroundColor Red
    cd ..
    exit 1
}

Write-Host "[BUILD] Compilando Electron..." -ForegroundColor Cyan
cd ../nest-electron
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error compilando Electron" -ForegroundColor Red
    cd ..
    exit 1
}

Write-Host "[SUCCESS] Compilacion completa exitosa!" -ForegroundColor Green
cd ..
