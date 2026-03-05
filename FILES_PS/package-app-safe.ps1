# package-app-safe.ps1
# Script mejorado para empaquetar con manejo de archivos bloqueados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Empaquetado Seguro de Produccion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Funcion para cerrar procesos de forma segura
function Stop-RelatedProcesses {
    Write-Host "[CLEANUP] Cerrando procesos relacionados..." -ForegroundColor Yellow
    
    $processNames = @("electron", "node", "python", "nest")
    
    foreach ($name in $processNames) {
        $processes = Get-Process | Where-Object {$_.ProcessName -like "*$name*"}
        if ($processes) {
            Write-Host "  Cerrando procesos: $name" -ForegroundColor Gray
            $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        }
    }
    
    Start-Sleep -Seconds 3
    Write-Host "[CLEANUP] Procesos cerrados" -ForegroundColor Green
}

# Funcion para limpiar carpeta con reintentos
function Remove-DirectorySafe {
    param(
        [string]$Path,
        [int]$MaxRetries = 5
    )
    
    if (-not (Test-Path $Path)) {
        return $true
    }
    
    Write-Host "  Limpiando: $Path" -ForegroundColor Gray
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Write-Host "  OK Eliminado: $Path" -ForegroundColor Green
            return $true
        } catch {
            if ($i -eq $MaxRetries) {
                Write-Host "  ERROR No se pudo eliminar: $Path" -ForegroundColor Red
                Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
                return $false
            }
            
            Write-Host "  Reintento $i/$MaxRetries..." -ForegroundColor Yellow
            Stop-RelatedProcesses
            Start-Sleep -Seconds ($i * 2)
        }
    }
    
    return $false
}

# Paso 1: Cerrar procesos
Stop-RelatedProcesses

# Paso 2: Limpiar builds anteriores
Write-Host ""
Write-Host "[CLEAN] Limpiando builds anteriores..." -ForegroundColor Yellow

$dirsToClean = @(
    "nest-ui-be\dist",
    "nest-ui-fe\dist",
    "nest-electron\dist",
    "nest-electron\release"
)

$allCleaned = $true
foreach ($dir in $dirsToClean) {
    if (-not (Remove-DirectorySafe -Path $dir)) {
        $allCleaned = $false
    }
}

if (-not $allCleaned) {
    Write-Host ""
    Write-Host "[WARNING] Algunos archivos no se pudieron eliminar" -ForegroundColor Yellow
    Write-Host "[INFO] Esto puede causar problemas. Continuar? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "[ABORT] Empaquetado cancelado" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "[CLEAN] Limpieza completada" -ForegroundColor Green

# Paso 3: Compilar Backend
Write-Host ""
Write-Host "[BUILD] Compilando Backend..." -ForegroundColor Cyan
Set-Location nest-ui-be

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Error compilando Backend" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "[BUILD] Backend compilado exitosamente" -ForegroundColor Green

# Paso 4: Compilar Frontend
Write-Host ""
Write-Host "[BUILD] Compilando Frontend..." -ForegroundColor Cyan
Set-Location ..\nest-ui-fe

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Error compilando Frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "[BUILD] Frontend compilado exitosamente" -ForegroundColor Green

# Paso 5: Cerrar procesos de nuevo antes de empaquetar
Write-Host ""
Set-Location ..\nest-electron
Stop-RelatedProcesses

# Paso 6: Empaquetar Electron
Write-Host ""
Write-Host "[PACKAGE] Empaquetando Electron..." -ForegroundColor Cyan
Write-Host "[INFO] Este proceso puede tomar varios minutos..." -ForegroundColor Gray
Write-Host ""

npm run dist:win

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Error empaquetando Electron" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Paso 7: Verificar resultado
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Empaquetado Completado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if (Test-Path "release") {
    $installer = Get-ChildItem -Path "release" -Filter "*.exe" | Select-Object -First 1
    if ($installer) {
        $sizeMB = [math]::Round($installer.Length / 1MB, 2)
        Write-Host "Instalador creado:" -ForegroundColor Cyan
        Write-Host "  Archivo: $($installer.Name)" -ForegroundColor White
        Write-Host "  Tamano: $sizeMB MB" -ForegroundColor White
        Write-Host "  Ubicacion: nest-electron\release\" -ForegroundColor White
        Write-Host ""
        
        $blockmap = Get-ChildItem -Path "release" -Filter "*.blockmap" | Select-Object -First 1
        if ($blockmap) {
            Write-Host "Archivos adicionales:" -ForegroundColor Cyan
            Write-Host "  - $($blockmap.Name)" -ForegroundColor Gray
        }
        
        if (Test-Path "release\win-unpacked") {
            Write-Host "  - win-unpacked\ (version portable)" -ForegroundColor Gray
        }
    } else {
        Write-Host "[WARNING] No se encontro el instalador .exe" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] No se encontro la carpeta release" -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""
Write-Host "Listo para distribuir!" -ForegroundColor Green
Write-Host ""
