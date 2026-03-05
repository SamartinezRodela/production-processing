# Script para compilar test_exe_source.py a ejecutable .exe
# Uso: .\compilar-test-exe.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Compilador de Test .exe" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si PyInstaller está instalado
Write-Host "Verificando PyInstaller..." -ForegroundColor Yellow
$pyinstallerCheck = python -m pip show pyinstaller 2>$null

if (-not $pyinstallerCheck) {
    Write-Host "PyInstaller no está instalado. Instalando..." -ForegroundColor Yellow
    python -m pip install pyinstaller
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: No se pudo instalar PyInstaller" -ForegroundColor Red
        exit 1
    }
    Write-Host "PyInstaller instalado correctamente" -ForegroundColor Green
} else {
    Write-Host "PyInstaller ya está instalado" -ForegroundColor Green
}

Write-Host ""

# Compilar el script
Write-Host "Compilando test_exe_source.py..." -ForegroundColor Yellow
Set-Location nest-files-py

# Opciones para reducir detección de antivirus:
# --noupx: No usar compresión UPX (común en malware)
# --onefile: Un solo archivo
# --clean: Limpiar cache antes de compilar
python -m PyInstaller --onefile --noupx --clean --distpath ../nest-files-py-embedded/executables --name test_exe test_exe_source.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: No se pudo compilar el ejecutable" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Compilación exitosa!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ejecutable creado en:" -ForegroundColor Cyan
Write-Host "  nest-files-py-embedded\executables\test_exe.exe" -ForegroundColor White
Write-Host ""
Write-Host "Puedes probarlo con:" -ForegroundColor Cyan
Write-Host "  .\nest-files-py-embedded\executables\test_exe.exe Juan" -ForegroundColor White
Write-Host ""
Write-Host "O desde el backend:" -ForegroundColor Cyan
Write-Host '  POST /python/execute-file' -ForegroundColor White
Write-Host '  { "fileName": "test_exe.exe", "args": ["Juan"] }' -ForegroundColor White
Write-Host ""

# Limpiar archivos temporales
Write-Host "Limpiando archivos temporales..." -ForegroundColor Yellow
if (Test-Path "nest-files-py\build") {
    Remove-Item -Recurse -Force "nest-files-py\build"
}
if (Test-Path "nest-files-py\test_exe.spec") {
    Remove-Item -Force "nest-files-py\test_exe.spec"
}

Write-Host "Listo!" -ForegroundColor Green
