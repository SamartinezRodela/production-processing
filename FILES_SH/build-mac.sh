#!/bin/bash

# Script para compilar y crear instalador para Mac
# Uso: ./build-mac.sh

set -e  # Detener si hay errores

echo "🚀 Iniciando compilación para Mac..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
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

# Verificar Python embebido para Mac
if [ ! -d "nest-files-py-embedded-mac" ]; then
    print_warning "Python embebido para Mac no encontrado"
    echo ""
    echo "Opciones:"
    echo "  1. Ejecutar: ./prepare-python-mac.sh (requiere Python instalado)"
    echo "  2. Continuar sin Python embebido (la app no funcionará correctamente)"
    echo ""
    read -p "¿Deseas continuar sin Python embebido? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Compilación cancelada"
        exit 1
    fi
fi

# Verificar que estamos en la raíz del proyecto
if [ ! -d "nest-ui-fe" ] || [ ! -d "nest-ui-be" ] || [ ! -d "nest-electron" ]; then
    print_error "Error: Debes ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# Paso 1: Compilar Frontend
print_step "Paso 1/4: Compilando Frontend (Angular)..."
cd nest-ui-fe
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend compilado exitosamente"
else
    print_error "Error al compilar Frontend"
    exit 1
fi
cd ..

# Paso 2: Compilar Backend
print_step "Paso 2/4: Compilando Backend (NestJS)..."
cd nest-ui-be
npm run build
if [ $? -eq 0 ]; then
    print_success "Backend compilado exitosamente"
else
    print_error "Error al compilar Backend"
    exit 1
fi
cd ..

# Paso 3: Compilar Electron
print_step "Paso 3/4: Compilando Electron..."
cd nest-electron
npm run build
if [ $? -eq 0 ]; then
    print_success "Electron compilado exitosamente"
else
    print_error "Error al compilar Electron"
    exit 1
fi

# Paso 4: Crear instalador DMG
print_step "Paso 4/4: Creando instalador DMG para Mac..."
npm run dist:mac
if [ $? -eq 0 ]; then
    print_success "Instalador creado exitosamente"
else
    print_error "Error al crear instalador"
    exit 1
fi

cd ..

echo ""
print_success "¡Compilación completada!"
echo ""
echo "📦 El instalador se encuentra en:"
echo "   nest-electron/release/Production Processing-1.0.0.dmg"
echo ""
echo "🎉 Para instalar, ejecuta:"
echo "   open nest-electron/release/Production\\ Processing-1.0.0.dmg"
echo ""
