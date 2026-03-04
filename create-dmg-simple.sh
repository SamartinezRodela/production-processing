#!/bin/bash

# Script SIMPLIFICADO para crear DMG en Mac
# Asume que TODO ya está compilado en Windows

set -e

echo "🍎 Creando DMG para Mac (modo simplificado)..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar que estamos en la raíz del proyecto
if [ ! -d "nest-electron" ]; then
    print_error "Error: Debes ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# Verificar que los archivos compilados existen
if [ ! -d "nest-ui-fe/dist" ] || [ ! -d "nest-ui-be/dist" ] || [ ! -d "nest-electron/dist" ]; then
    print_error "Error: Archivos compilados no encontrados"
    echo ""
    echo "Debes ejecutar en Windows primero:"
    echo "  .\\build-all.ps1"
    echo ""
    exit 1
fi

print_success "Archivos compilados encontrados"

# Verificar Python embebido para Mac
if [ ! -d "nest-files-py-embedded-mac" ]; then
    print_warning "Python embebido para Mac no encontrado"
    echo ""
    echo "Ejecutando prepare-python-mac.sh..."
    ./prepare-python-mac.sh
    if [ $? -ne 0 ]; then
        print_error "Error preparando Python embebido"
        exit 1
    fi
fi

print_success "Python embebido para Mac encontrado"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo ""
    echo "Instalar con: brew install node"
    exit 1
fi

print_success "Node.js encontrado: $(node --version)"

# Instalar dependencias de Electron si no existen
cd nest-electron
if [ ! -d "node_modules" ]; then
    print_step "Instalando dependencias de Electron..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Error instalando dependencias"
        exit 1
    fi
    print_success "Dependencias instaladas"
else
    print_success "Dependencias de Electron ya instaladas"
fi

# Crear DMG
print_step "Creando instalador DMG..."
npm run dist:mac

if [ $? -eq 0 ]; then
    print_success "¡DMG creado exitosamente!"
    echo ""
    echo "📦 El instalador se encuentra en:"
    echo "   nest-electron/release/Production Processing-1.0.0.dmg"
    echo ""
else
    print_error "Error al crear DMG"
    exit 1
fi

cd ..
