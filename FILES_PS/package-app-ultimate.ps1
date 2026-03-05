# package-app-ultimate.ps1
# Solucion definitiva para el error EBUSY

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Empaquetado Ultimate - Anti-EBUSY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Cerrar TODO
Write-Host "[FIX] Cerrando TODOS los procesos relacionados..." -ForegroundColor Yellow

# Cerrar VSCode si esta abierto
Get-Process | Where-Object {$_.ProcessName -like "*code*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Cerrar procesos relacionados
$processNames = @("electron", "node", "python", "nest", "npm")
foreach ($name in $processNames) {
    Get-Process | Where-Object {$_.ProcessName -like "*$name*"} | Stop-Process -Force -ErrorAction SilentlyContinue
}

Write-Host "  OK Procesos cerrados" -ForegroundColor Green
Start-Sleep -Seconds 5

# Paso 2: Deshabilitar Windows Defender temporalmente (opcional)
Write-Host ""
Write-Host "[FIX] Desea deshabilitar Windows Defender temporalmente? (S/N)" -ForegroundColor Yellow
Write-Host "      Esto puede ayudar si el antivirus esta bloqueando archivos" -ForegroundColor Gray
$disableDefender = Read-Host

if ($disableDefender -eq "S" -or $disableDefender -eq "s") {
    Write-Host "  Deshabilitando Windows Defender..." -ForegroundColor Yellow
    Write-Host "  NOTA: Requiere permisos de Administrador" -ForegroundColor Gray
    
    try {
        Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction Stop
        Write-Host "  OK Windows Defender deshabilitado temporalmente" -ForegroundColor Green
        $defenderDisabled = $true
    } catch {
        Write-Host "  WARN No se pudo deshabilitar (requiere Administrador)" -ForegroundColor Yellow
        $defenderDisabled = $false
    }
} else {
    $defenderDisabled = $false
}

# Paso 3: Limpiar con fuerza
Write-Host ""
Write-Host "[CLEAN] Limpieza agresiva..." -ForegroundColor Yellow

$dirsToClean = @(
    "nest-ui-be\dist",
    "nest-ui-fe\dist",
    "nest-electron\dist",
    "nest-electron\release"
)

foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Write-Host "  Eliminando: $dir" -ForegroundColor Gray
        
        # Intentar 3 veces
        for ($i = 1; $i -le 3; $i++) {
            try {
                # Quitar atributos de solo lectura
                Get-ChildItem -Path $dir -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
                    $_.Attributes = 'Normal'
                }
                
                Remove-Item -Path $dir -Recurse -Force -ErrorAction Stop
                Write-Host "  OK Eliminado: $dir" -ForegroundColor Green
                break
            } catch {
                if ($i -eq 3) {
                    Write-Host "  ERROR No se pudo eliminar: $dir" -ForegroundColor Red
                } else {
                    Write-Host "  Reintento $i..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 3
                }
            }
        }
    }
}

Start-Sleep -Seconds 3

# Paso 4: Compilar Backend
Write-Host ""
Write-Host "[BUILD] Compilando Backend..." -ForegroundColor Cyan
Set-Location nest-ui-be
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error compilando Backend" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Paso 5: Compilar Frontend
Write-Host ""
Write-Host "[BUILD] Compilando Frontend..." -ForegroundColor Cyan
Set-Location ..\nest-ui-fe
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error compilando Frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Paso 6: Cerrar procesos DE NUEVO
Write-Host ""
Write-Host "[FIX] Cerrando procesos antes de empaquetar..." -ForegroundColor Yellow
Set-Location ..\nest-electron

Get-Process | Where-Object {
    $_.ProcessName -like "*electron*" -or 
    $_.ProcessName -like "*node*" -or 
    $_.ProcessName -like "*python*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 5

# Paso 7: Empaquetar con manejo de errores
Write-Host ""
Write-Host "[PACKAGE] Empaquetando Electron..." -ForegroundColor Cyan
Write-Host ""

$packageSuccess = $false
$maxAttempts = 2

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    if ($attempt -gt 1) {
        Write-Host ""
        Write-Host "[RETRY] Intento $attempt de $maxAttempts..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
    
    npm run dist:win
    
    if ($LASTEXITCODE -eq 0) {
        $packageSuccess = $true
        break
    }
}

# Paso 8: Reactivar Windows Defender si se deshabilitó
if ($defenderDisabled) {
    Write-Host ""
    Write-Host "[FIX] Reactivando Windows Defender..." -ForegroundColor Yellow
    try {
        Set-MpPreference -DisableRealtimeMonitoring $false -ErrorAction Stop
        Write-Host "  OK Windows Defender reactivado" -ForegroundColor Green
    } catch {
        Write-Host "  WARN No se pudo reactivar automaticamente" -ForegroundColor Yellow
        Write-Host "  Reactivelo manualmente en Windows Security" -ForegroundColor Yellow
    }
}

# Paso 9: Verificar resultado
Write-Host ""
if ($packageSuccess) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  EXITO! Empaquetado Completado" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    if (Test-Path "release") {
        $installer = Get-ChildItem -Path "release" -Filter "*.exe" | Select-Object -First 1
        if ($installer) {
            $sizeMB = [math]::Round($installer.Length / 1MB, 2)
            Write-Host "Instalador:" -ForegroundColor Cyan
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
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "1. Cerrar VSCode completamente" -ForegroundColor White
    Write-Host "2. Reiniciar la PC" -ForegroundColor White
    Write-Host "3. Agregar exclusion en antivirus:" -ForegroundColor White
    Write-Host "   .\FILES_PS\agregar-exclusion-antivirus.ps1" -ForegroundColor Gray
    Write-Host "4. Ver guia completa:" -ForegroundColor White
    Write-Host "   GUIAS\SOLUCION-ERROR-EBUSY-PACKAGE.md" -ForegroundColor Gray
}

Set-Location ..
Write-Host ""
