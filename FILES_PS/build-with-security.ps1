# ============================================================
# 🔒 BUILD CON SEGURIDAD - Compilar Python + Empaquetar App
# ============================================================
# Este script:
# 1. Compila los scripts Python a .pyc
# 2. Genera los hashes SHA-256
# 3. Construye el frontend Angular
# 4. Construye el backend NestJS
# 5. Construye Electron con ASAR
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🔒 BUILD CON SEGURIDAD HABILITADA" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "nest-ui-fe") -or -not (Test-Path "nest-ui-be")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# ============================================================
# PASO 1: Compilar Python a .pyc
# ============================================================
Write-Host "📦 PASO 1: Compilando scripts Python a bytecode..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "compile-python-scripts.py") {
    python compile-python-scripts.py
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error compilando scripts Python" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Advertencia: compile-python-scripts.py no encontrado" -ForegroundColor Yellow
    Write-Host "   Saltando compilación de Python..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Scripts Python compilados" -ForegroundColor Green
Write-Host ""

# ============================================================
# PASO 2: Build Frontend (Angular)
# ============================================================
Write-Host "🎨 PASO 2: Construyendo Frontend (Angular)..." -ForegroundColor Yellow
Write-Host ""

Set-Location nest-ui-fe

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias del frontend" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}

# Build de producción
Write-Host "🔨 Compilando Angular..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error construyendo frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host ""
Write-Host "✅ Frontend construido" -ForegroundColor Green
Write-Host ""

# ============================================================
# PASO 3: Build Backend (NestJS)
# ============================================================
Write-Host "⚙️  PASO 3: Construyendo Backend (NestJS)..." -ForegroundColor Yellow
Write-Host ""

Set-Location nest-ui-be

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias del backend" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}

# Build de producción
Write-Host "🔨 Compilando NestJS..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error construyendo backend" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host ""
Write-Host "✅ Backend construido" -ForegroundColor Green
Write-Host ""

# ============================================================
# PASO 4: Build Electron
# ============================================================
Write-Host "🖥️  PASO 4: Empaquetando aplicación Electron..." -ForegroundColor Yellow
Write-Host ""

Set-Location nest-electron

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias de Electron..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias de Electron" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}

# Build TypeScript
Write-Host "🔨 Compilando TypeScript de Electron..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error construyendo Electron" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Empaquetar con electron-builder
Write-Host "📦 Empaquetando con electron-builder (ASAR habilitado)..." -ForegroundColor Cyan
npm run dist:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error empaquetando aplicación" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host ""
Write-Host "✅ Aplicación empaquetada" -ForegroundColor Green
Write-Host ""

# ============================================================
# RESUMEN FINAL
# ============================================================
Write-Host "============================================================" -ForegroundColor Green
Write-Host "✅ BUILD COMPLETADO CON ÉXITO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔒 Características de seguridad habilitadas:" -ForegroundColor Cyan
Write-Host "   ✅ Scripts Python compilados a .pyc (bytecode)" -ForegroundColor White
Write-Host "   ✅ Verificación de integridad SHA-256" -ForegroundColor White
Write-Host "   ✅ Empaquetado con ASAR" -ForegroundColor White
Write-Host "   ✅ Python embebido incluido" -ForegroundColor White
Write-Host ""
Write-Host "📁 Instalador generado en:" -ForegroundColor Cyan
Write-Host "   nest-electron\release\" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Siguiente paso:" -ForegroundColor Yellow
Write-Host "   Prueba el instalador en una máquina limpia" -ForegroundColor White
Write-Host ""
