# Requiere ejecutar como Administrador
#Requires -RunAsAdministrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Agregar Exclusión de Antivirus" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$executablesPath = "$PSScriptRoot\nest-files-py-embedded\executables"

Write-Host "Agregando exclusión para:" -ForegroundColor Yellow
Write-Host "  $executablesPath" -ForegroundColor White
Write-Host ""

try {
    # Agregar exclusión en Windows Defender
    Add-MpPreference -ExclusionPath $executablesPath
    
    Write-Host "✅ Exclusión agregada exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Exclusiones actuales:" -ForegroundColor Cyan
    Get-MpPreference | Select-Object -ExpandProperty ExclusionPath | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Ahora puedes compilar y ejecutar tus .exe sin problemas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al agregar exclusión:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Asegúrate de ejecutar este script como Administrador:" -ForegroundColor Yellow
    Write-Host "  1. Click derecho en el archivo" -ForegroundColor White
    Write-Host "  2. Seleccionar 'Ejecutar como Administrador'" -ForegroundColor White
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
