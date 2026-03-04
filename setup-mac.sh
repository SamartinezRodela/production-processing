#!/bin/bash

# Script de configuración inicial para Mac
# Uso: ./setup-mac.sh

set -e

echo "🔧 Configuración inicial para Mac"
echo "=================================="
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

# Verificar Node.js
print_step "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js instalado: $NODE_VERSION"
else
    print_error "Node.js no está instalado"
    echo "Instala Node.js desde: https://nodejs.org/"
    echo "O usa Homebrew: brew install node"
    exit 1
fi

# Verificar npm
print_step "Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm instalado: $NPM_VERSION"
else
    print_error "npm no está instalado"
    exit 1
fi

# Verificar Python
print_step "Verificando Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python instalado: $PYTHON_VERSION"
else
    print_warning "Python3 no está instalado"
    echo "Instala Python desde: https://www.python.org/"
    echo "O usa Homebrew: brew install python3"
fi

# Verificar pip
if command -v pip3 &> /dev/null; then
    PIP_VERSION=$(pip3 --version)
    print_success "pip3 instalado: $PIP_VERSION"
fi

echo ""
print_step "Instalando dependencias de Python..."
pip3 install --user reportlab PyPDF2 || print_warning "No se pudieron instalar algunas dependencias de Python"

echo ""
print_step "Instalando dependencias de Node.js..."

# Frontend
if [ -d "nest-ui-fe" ]; then
    print_step "Instalando dependencias de Frontend..."
    cd nest-ui-fe
    npm install
    print_success "Dependencias de Frontend instaladas"
    cd ..
else
    print_warning "Carpeta nest-ui-fe no encontrada"
fi

# Backend
if [ -d "nest-ui-be" ]; then
    print_step "Instalando dependencias de Backend..."
    cd nest-ui-be
    npm install
    print_success "Dependencias de Backend instaladas"
    cd ..
else
    print_warning "Carpeta nest-ui-be no encontrada"
fi

# Electron
if [ -d "nest-electron" ]; then
    print_step "Instalando dependencias de Electron..."
    cd nest-electron
    npm install
    print_success "Dependencias de Electron instaladas"
    cd ..
else
    print_warning "Carpeta nest-electron no encontrada"
fi

echo ""
print_step "Creando estructura de carpetas..."
mkdir -p ~/Production/Base_Files
print_success "Carpeta Base_Files creada en ~/Production/"

echo ""
print_step "Dando permisos de ejecución a scripts..."
chmod +x build-mac.sh
chmod +x dev-mac.sh
chmod +x setup-mac.sh
print_success "Permisos otorgados"

echo ""
echo "=================================="
print_success "¡Configuración completada!"
echo "=================================="
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Copia tus archivos Base_Files a:"
echo "   ~/Production/Base_Files/"
echo ""
echo "2. Para desarrollo, ejecuta:"
echo "   ./dev-mac.sh"
echo ""
echo "3. Para crear instalador, ejecuta:"
echo "   ./build-mac.sh"
echo ""
echo "4. Lee la guía completa en:"
echo "   GUIA-DESARROLLO-MAC.md"
echo ""
