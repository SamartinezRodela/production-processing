# Script para ejecutar todas las pruebas de bibliotecas Python
# Uso: .\run_tests.ps1

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS DE BIBLIOTECAS PYTHON" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Detectar Python
$pythonExe = "python"
if (Test-Path "..\nest-files-py-embedded\python.exe") {
    $pythonExe = "..\nest-files-py-embedded\python.exe"
    Write-Host "Usando Python embebido" -ForegroundColor Yellow
} else {
    Write-Host "Usando Python del sistema" -ForegroundColor Yellow
}

Write-Host ""

# Test 1: Verificar imports
Write-Host "[1/8] Verificando imports..." -ForegroundColor Cyan
& $pythonExe test_all_libraries.py
Write-Host ""

# Test 2: NumPy y Pandas
Write-Host "[2/8] Probando NumPy..." -ForegroundColor Cyan
& $pythonExe test_numpy_pandas.py
Write-Host ""

Write-Host "[3/8] Probando Pandas..." -ForegroundColor Cyan
& $pythonExe test_numpy_pandas.py pandas
Write-Host ""

# Test 4: ReportLab
Write-Host "[4/8] Probando ReportLab..." -ForegroundColor Cyan
& $pythonExe test_reportlab.py "output\test_reportlab.pdf"
Write-Host ""

# Test 5: Matplotlib
Write-Host "[5/8] Probando Matplotlib..." -ForegroundColor Cyan
& $pythonExe test_matplotlib.py lineas "output\test_matplotlib.png"
Write-Host ""

# Test 6: OpenCV
Write-Host "[6/8] Probando OpenCV..." -ForegroundColor Cyan
& $pythonExe test_opencv.py "output\test_opencv.png"
Write-Host ""

# Test 7: Pillow
Write-Host "[7/8] Probando Pillow..." -ForegroundColor Cyan
& $pythonExe test_pillow.py "output\test_pillow.png"
Write-Host ""

# Test 8: SciPy
Write-Host "[8/8] Probando SciPy..." -ForegroundColor Cyan
& $pythonExe test_scipy.py
Write-Host ""

Write-Host "==================================================" -ForegroundColor Green
Write-Host "  PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Archivos generados en: nest-files-py\output\" -ForegroundColor Yellow
