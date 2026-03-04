#!/bin/bash

echo "🍎 Preparando Python embebido para Mac..."
echo ""

# Verificar si ya existe Python embebido de Windows
if [ -d "nest-files-py-embedded" ]; then
    echo "⚠️  Detectado Python embebido de Windows"
    echo "   No se puede usar directamente en Mac (arquitectura diferente)"
    echo ""
fi

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado"
    echo ""
    echo "Opciones:"
    echo "  1. Instalar Python: brew install python@3.11"
    echo "  2. O compilar en Windows y usar create-dmg.sh (no requiere Python)"
    echo ""
    exit 1
fi

echo "✅ Python encontrado: $(python3 --version)"
echo ""

# Crear carpeta
mkdir -p nest-files-py-embedded-mac
cd nest-files-py-embedded-mac

# Crear venv
echo "📦 Creando entorno virtual..."
python3 -m venv python-runtime

# Activar
source python-runtime/bin/activate

# Crear requirements.txt
cat > requirements.txt << EOF
pypdf
pillow
reportlab
openpyxl
requests
pandas
numpy
EOF

# Instalar
echo "📥 Instalando bibliotecas..."
pip install -r requirements.txt

# Copiar scripts
echo "📁 Copiando scripts..."
if [ -d "../nest-files-py" ]; then
    cp ../nest-files-py/*.py . 2>/dev/null || echo "⚠️  No se encontraron scripts .py"
else
    echo "⚠️  Carpeta nest-files-py no encontrada"
fi

# Desactivar
deactivate

echo ""
echo "✅ Python embebido listo para Mac!"
echo "📍 Ubicación: nest-files-py-embedded-mac/"
echo ""
echo "⚠️  NOTA: Este Python embebido es específico para Mac"
echo "   No funcionará en Windows (usa nest-files-py-embedded para Windows)"
echo ""
echo "Siguiente paso:"
echo "  ./build-mac.sh"

cd ..
