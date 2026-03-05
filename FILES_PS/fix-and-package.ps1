# fix-and-package.ps1
# Script que soluciona problemas de archivos bloqueados y empaqueta

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix & Package - Solucion Automatica" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Cerrar procesos
Write-Host "[FIX] Cerrando procesos relacionados..." -ForegroundColor Yellow

$processNames = @("electron", "node", "python", "nest")
$closedCount = 0

foreach ($name in $processNames) {
    $processes = Get-Process | Where-Object {$_.ProcessName -like "*$name*"} -ErrorAction SilentlyContinue
    if ($processes) {
        $count = $processes.Count
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        $closedCount += $count
        Write-Host "  OK Cerrados $count procesos de: $name" -ForegroundColor Gray
    }
}

if ($closedCount -eq 0) {
    Write-Host "  OK No hay procesos que cerrar" -ForegroundColor Green
} else {
    Write-Host "  OK Total de procesos cerrados: $closedCount" -ForegroundColor Green
}

# Paso 2: Esperar liberacion de archivos
Write-Host ""
Write-Host "[FIX] Esperando liberacion de archivos..." -ForegroundColor Yellow
for ($i = 5; $i -gt 0; $i--) {
    Write-Host "  $i..." -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 1
}
Write-Host " OK" -ForegroundColor Green

# Paso 3: Limpiar builds anteriores
Write-Host ""
Write-Host "[FIX] Limpiando builds anteriores..." -ForegroundColor Yellow

$dirsToClean = @(
    "nest-ui-be\dist",
    "nest-ui-fe\dist",
    "nest-electron\dist",
    "nest-electron\release"
)

foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        try {
            Remove-Item -Path $dir -Recurse -Force -ErrorAction Stop
            Write-Host "  OK Eliminado: $dir" -ForegroundColor Gray
        } catch {
            Write-Host "  WARN No se pudo eliminar: $dir" -ForegroundColor Yellow
        }
    }
}

# Paso 4: Esperar de nuevo
Write-Host ""
Write-Host "[FIX] Esperando estabilizacion..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "  OK Sistema estable" -ForegroundColor Green

# Paso 5: Ejecutar empaquetado seguro
Write-Host ""
Write-Host "[PACKAGE] Iniciando empaquetado seguro..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "FILES_PS\package-app-safe.ps1") {
    & ".\FILES_PS\package-app-safe.ps1"
} else {
    Write-Host "[ERROR] No se encontro package-app-safe.ps1" -ForegroundColor Red
    Write-Host "[INFO] Ejecutando package-app.ps1 en su lugar..." -ForegroundColor Yellow
    
    if (Test-Path "FILES_PS\package-app.ps1") {
        & ".\FILES_PS\package-app.ps1"
    } else {
        Write-Host "[ERROR] No se encontro ningun script de empaquetado" -ForegroundColor Red
        exit 1
    }
}
