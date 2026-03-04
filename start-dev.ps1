# Script para iniciar toda la aplicación en modo desarrollo
# Uso: .\start-dev.ps1

Write-Host " Iniciando NEST-UI-V2 en modo desarrollo..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "nest-ui-fe") -or -not (Test-Path "nest-ui-be") -or -not (Test-Path "nest-electron")) {
    Write-Host " Error: Ejecuta este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host " Verificando dependencias..." -ForegroundColor Yellow

# Verificar node_modules en cada proyecto
$projects = @("nest-ui-be", "nest-ui-fe", "nest-electron")
foreach ($project in $projects) {
    if (-not (Test-Path "$project/node_modules")) {
        Write-Host "  Instalando dependencias en $project..." -ForegroundColor Yellow
        Set-Location $project
        npm install
        Set-Location ..
    }
}

Write-Host ""
Write-Host " Dependencias verificadas" -ForegroundColor Green
Write-Host ""
Write-Host " Iniciando servicios..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Se abrirán 3 ventanas de PowerShell:" -ForegroundColor White
Write-Host "  1️  Backend NestJS (puerto 3000)" -ForegroundColor White
Write-Host "  2️  Frontend Angular (puerto 4200)" -ForegroundColor White
Write-Host "  3️ Electron (ventana de escritorio)" -ForegroundColor White
Write-Host ""

# Iniciar Backend
Write-Host "Iniciando Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\nest-ui-be'; Write-Host '🔧 Backend NestJS' -ForegroundColor Green; npm run start:dev"

# Esperar 3 segundos
Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host " Iniciando Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\nest-ui-fe'; Write-Host '🎨 Frontend Angular' -ForegroundColor Blue; npm start"

# Esperar 8 segundos para que Angular compile
Start-Sleep -Seconds 8

# Iniciar Electron
Write-Host " Iniciando Electron..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\nest-electron'; Write-Host '⚡ Electron' -ForegroundColor Magenta; npm run start:dev"

Write-Host ""
Write-Host " Todos los servicios iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host " Notas:" -ForegroundColor Yellow
Write-Host "  - Backend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Angular: http://localhost:4200" -ForegroundColor White
Write-Host "  - Electron: Se abrirá automáticamente" -ForegroundColor White
Write-Host ""
Write-Host "Para detener: Cierra las 3 ventanas de PowerShell" -ForegroundColor Yellow
Write-Host ""
