#!/bin/bash

# Script para crear DMG en Mac después de compilar en Windows
# Uso: ./create-dmg.sh

set -e

echo ""
echo "🍎 Creando instalador DMG para Mac"
echo "==================================="
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

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Verificar que estamos en la raíz del proyecto
if [ ! -d "nest-electron" ]; then
    print_error "Error: Debes ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# Verificar que los archivos compilados existen
print_step "Verificando archivos compilados..."

if [ ! -d "nest-ui-fe/dist/nest-ui-fe/browser" ]; then
    print_error "Frontend no compilado. Ejecuta 'compile-for-mac.ps1' en Windows primero."
    exit 1
fi

if [ ! -d "nest-ui-be/dist" ]; then
    print_error "Backend no compilado. Ejecuta 'compile-for-mac.ps1' en Windows primero."
    exit 1
fi

if [ ! -d "nest-electron/dist" ]; then
    print_error "Electron no compilado. Ejecuta 'compile-for-mac.ps1' en Windows primero."
    exit 1
fi

print_success "Todos los archivos compilados encontrados"

# Ir a la carpeta de Electron
cd nest-electron

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    print_step "Instalando dependencias de Electron..."
    npm install
    print_success "Dependencias instaladas"
else
    print_success "Dependencias ya instaladas"
fi

# Crear el DMG
print_step "Creando instalador DMG..."
echo ""
npm run dist:mac

if [ $? -eq 0 ]; then
    echo ""
    print_success "¡DMG creado exitosamente!"
    echo ""
    echo "==================================="
    echo -e "${GREEN}📦 Instalador creado:${NC}"
    echo ""
    
    # Buscar el DMG creado
    DMG_FILE=$(find release -name "*.dmg" -type f | head -n 1)
    
    if [ -n "$DMG_FILE" ]; then
        DMG_SIZE=$(du -h "$DMG_FILE" | cut -f1)
        echo -e "   Archivo: ${BLUE}$DMG_FILE${NC}"
        echo -e "   Tamaño:  ${BLUE}$DMG_SIZE${NC}"
        echo ""
        
        # Preguntar si quiere abrir la carpeta
        read -p "¿Quieres abrir la carpeta de release? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open release/
        fi
        
        echo ""
        echo "==================================="
        echo -e "${YELLOW}📝 Para instalar:${NC}"
        echo "   1. Abre el DMG"
        echo "   2. Arrastra la app a Applications"
        echo "   3. Si macOS bloquea la app, ejecuta:"
        echo -e "      ${BLUE}xattr -cr \"/Applications/Production Processing.app\"${NC}"
        echo ""
    else
        print_warning "DMG creado pero no se pudo encontrar en release/"
    fi
else
    echo ""
    print_error "Error al crear DMG"
    echo ""
    echo "Posibles soluciones:"
    echo "1. Verifica que todos los archivos estén compilados"
    echo "2. Reinstala dependencias: rm -rf node_modules && npm install"
    echo "3. Revisa los logs arriba para más detalles"
    exit 1
fi

cd ..

echo ""
print_success "¡Proceso completado! 🎉"
echo ""
