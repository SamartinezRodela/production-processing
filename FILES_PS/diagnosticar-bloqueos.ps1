# diagnosticar-bloqueos.ps1
# Script para diagnosticar archivos bloqueados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnostico de Archivos Bloqueados" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ver procesos relacionados
Write-Host "[1] Procesos Relacionados:" -ForegroundColor Yellow
$processes = Get-Process | Where-Object {
    $_.ProcessName -like "*python*" -or
    $_.ProcessName -like "*electron*" -or
    $_.ProcessName -like "*node*" -or
    $_.ProcessName -like "*Production*"
}

if ($processes) {
    $processes | Select-Object ProcessName, Id, StartTime | Format-Table
} else {
    Write-Host "  No hay procesos relacionados corriendo" -ForegroundColor Green
}

Write-Host ""

# 2. Estado de Windows Defender
Write-Host "[2] Estado de Windows Defender:" -ForegroundColor Yellow
try {
    $defenderStatus = Get-MpComputerStatus
    Write-Host "  Proteccion en tiempo real: $($defenderStatus.RealTimeProtectionEnabled)" -ForegroundColor $(if($defenderStatus.RealTimeProtectionEnabled){"Red"}else{"Green"})
    Write-Host "  Proteccion de comportamiento: $($defenderStatus.BehaviorMonitorEnabled)" -ForegroundColor $(if($defenderStatus.BehaviorMonitorEnabled){"Red"}else{"Green"})
    Write-Host "  Antivirus habilitado: $($defenderStatus.AntivirusEnabled)" -ForegroundColor $(if($defenderStatus.AntivirusEnabled){"Red"}else{"Green"})
} catch {
    Write-Host "  No se pudo obtener estado de Defender" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar archivos especificos
Write-Host "[3] Verificando Archivos Criticos:" -ForegroundColor Yellow

$filesToCheck = @(
    "C:\Projects\NEST-UI-V2\nest-files-py-embedded\get-pip.py",
    "C:\Projects\NEST-UI-V2\nest-files-py-embedded\_lzma.pyd",
    "C:\Projects\NEST-UI-V2\nest-files-py-embedded\_zoneinfo.pyd",
    "C:\Projects\NEST-UI-V2\nest-files-py-embedded\python.exe"
)

foreach ($filePath in $filesToCheck) {
    if (Test-Path $filePath) {
        $fileName = Split-Path $filePath -Leaf
        Write-Host "  Verificando: $fileName" -ForegroundColor Gray
        
        try {
            $file = [System.IO.File]::Open($filePath, 'Open', 'Read', 'None')
            $file.Close()
            Write-Host "    Estado: OK (no bloqueado)" -ForegroundColor Green
        } catch {
            Write-Host "    Estado: BLOQUEADO" -ForegroundColor Red
            Write-Host "    Razon: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# 4. Verificar carpeta release
Write-Host "[4] Estado de Carpeta Release:" -ForegroundColor Yellow
if (Test-Path "C:\Projects\NEST-UI-V2\nest-electron\release") {
    $releaseSize = (Get-ChildItem "C:\Projects\NEST-UI-V2\nest-electron\release" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  Carpeta existe" -ForegroundColor Yellow
    Write-Host "  Tamano: $([math]::Round($releaseSize, 2)) MB" -ForegroundColor Gray
    
    # Intentar eliminar
    Write-Host "  Intentando eliminar..." -ForegroundColor Gray
    try {
        Remove-Item "C:\Projects\NEST-UI-V2\nest-electron\release" -Recurse -Force -ErrorAction Stop
        Write-Host "  OK: Carpeta eliminada exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: No se pudo eliminar" -ForegroundColor Red
        Write-Host "  Razon: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  Carpeta no existe (OK)" -ForegroundColor Green
}

Write-Host ""

# 5. Exclusiones de Defender
Write-Host "[5] Exclusiones de Windows Defender:" -ForegroundColor Yellow
try {
    $exclusions = Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
    if ($exclusions) {
        $hasExclusion = $false
        foreach ($exclusion in $exclusions) {
            if ($exclusion -like "*nest-files-py-embedded*") {
                Write-Host "  OK: nest-files-py-embedded esta excluido" -ForegroundColor Green
                $hasExclusion = $true
            }
        }
        if (-not $hasExclusion) {
            Write-Host "  WARN: nest-files-py-embedded NO esta excluido" -ForegroundColor Red
            Write-Host "  Agregar con: Add-MpPreference -ExclusionPath 'C:\Projects\NEST-UI-V2\nest-files-py-embedded'" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  No hay exclusiones configuradas" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  No se pudo verificar exclusiones (requiere permisos)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnostico Completo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Recomendaciones
Write-Host "Recomendaciones:" -ForegroundColor Yellow
Write-Host "1. Si hay procesos corriendo, cerrarlos" -ForegroundColor White
Write-Host "2. Si Defender esta activo, desactivarlo temporalmente" -ForegroundColor White
Write-Host "3. Si archivos estan bloqueados, esperar o reiniciar" -ForegroundColor White
Write-Host "4. Si carpeta release no se puede eliminar, reiniciar Windows" -ForegroundColor White
Write-Host ""
