# package-with-temp-python.ps1
# Empaqueta usando copia temporal de Python para evitar bloqueos

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Empaquetado con Python Temporal" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$tempPythonPath = "$env:TEMP\nest-python-build"
$sourcePythonPath = "C:\Projects\NEST-UI-V2\nest-files-py-embedded"

# 1. Limpiar temporal anterior
Write-Host "[CLEAN] Limpiando Python temporal anterior..." -ForegroundColor Yellow
if (Test-Path $tempPythonPath) {
    Remove-Item $tempPythonPath -Recurse -Force -ErrorAction SilentlyContinue
}

# 2. Copiar Python a ubicación temporal
Write-Host "[COPY] Copiando Python a ubicacion temporal..." -ForegroundColor Yellow
Write-Host "  Desde: $sourcePythonPath" -ForegroundColor Gray
Write-Host "  Hacia: $tempPythonPath" -ForegroundColor Gray

try {
    Copy-Item -Path $sourcePythonPath -Destination $tempPythonPath -Recurse -Force
    Write-Host "  OK: Python copiado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: No se pudo copiar Python" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Modificar package.json temporalmente
Write-Host ""
Write-Host "[CONFIG] Modificando configuracion temporal..." -ForegroundColor Yellow

$packageJsonPath = "C:\Projects\NEST-UI-V2\nest-electron\package.json"
$packageJsonBackup = "C:\Projects\NEST-UI-V2\nest-electron\package.json.backup"

# Backup del package.json original
Copy-Item $packageJsonPath $packageJsonBackup -Force

# Leer y modificar package.json
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

# Modificar la ruta de Python en extraResources
foreach ($resource in $packageJson.build.extraResources) {
    if ($resource.from -eq "../nest-files-py-embedded") {
        $resource.from = $tempPythonPath
        Write-Host "  Ruta actualizada a: $tempPythonPath" -ForegroundColor Gray
    }
}

# Modificar en win.extraResources también
if ($packageJson.build.win.extraResources) {
    foreach ($resource in $packageJson.build.win.extraResources) {
        if ($resource.from -eq "../nest-files-py-embedded") {
            $resource.from = $tempPythonPath
        }
    }
}

# Guardar package.json modificado
$packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath

Write-Host "  OK: Configuracion actualizada" -ForegroundColor Green

# 4. Compilar Backend
Write-Host ""
Write-Host "[BUILD] Compilando Backend..." -ForegroundColor Cyan
Set-Location C:\Projects\NEST-UI-V2\nest-ui-be
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error compilando Backend" -ForegroundColor Red
    # Restaurar package.json
    Copy-Item $packageJsonBackup $packageJsonPath -Force
    Remove-Item $packageJsonBackup -Force
    exit 1
}

# 5. Compilar Frontend
Write-Host ""
Write-Host "[BUILD] Compilando Frontend..." -ForegroundColor Cyan
Set-Location C:\Projects\NEST-UI-V2\nest-ui-fe
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error compilando Frontend" -ForegroundColor Red
    # Restaurar package.json
    Copy-Item $packageJsonBackup $packageJsonPath -Force
    Remove-Item $packageJsonBackup -Force
    exit 1
}

# 6. Limpiar release
Write-Host ""
Write-Host "[CLEAN] Limpiando release anterior..." -ForegroundColor Yellow
Set-Location C:\Projects\NEST-UI-V2\nest-electron
Remove-Item release -Recurse -Force -ErrorAction SilentlyContinue

# 7. Empaquetar
Write-Host ""
Write-Host "[PACKAGE] Empaquetando Electron..." -ForegroundColor Cyan
Write-Host "[INFO] Usando Python desde: $tempPythonPath" -ForegroundColor Gray
Write-Host ""

npm run dist:win

$buildSuccess = $LASTEXITCODE -eq 0

# 8. Restaurar package.json original
Write-Host ""
Write-Host "[RESTORE] Restaurando configuracion original..." -ForegroundColor Yellow
Copy-Item $packageJsonBackup $packageJsonPath -Force
Remove-Item $packageJsonBackup -Force
Write-Host "  OK: Configuracion restaurada" -ForegroundColor Green

# 9. Limpiar Python temporal
Write-Host ""
Write-Host "[CLEAN] Limpiando Python temporal..." -ForegroundColor Yellow
Remove-Item $tempPythonPath -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  OK: Temporal limpiado" -ForegroundColor Green

# 10. Resultado
Write-Host ""
if ($buildSuccess) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  EXITO! Empaquetado Completado" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    if (Test-Path "release") {
        $installer = Get-ChildItem -Path "release" -Filter "*.exe" | Select-Object -First 1
        if ($installer) {
            $sizeMB = [math]::Round($installer.Length / 1MB, 2)
            Write-Host "Instalador creado:" -ForegroundColor Cyan
            Write-Host "  $($installer.Name)" -ForegroundColor White
            Write-Host "  Tamano: $sizeMB MB" -ForegroundColor White
            Write-Host "  Ubicacion: nest-electron\release\" -ForegroundColor White
        }
    }
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ERROR: Empaquetado Fallo" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "El error persiste. Intenta:" -ForegroundColor Yellow
    Write-Host "1. Reiniciar Windows" -ForegroundColor White
    Write-Host "2. Ejecutar este script de nuevo" -ForegroundColor White
}

Set-Location C:\Projects\NEST-UI-V2
Write-Host ""
