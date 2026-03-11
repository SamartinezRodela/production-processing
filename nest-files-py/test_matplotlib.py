"""
Test: Matplotlib - Gráficos y visualizaciones
"""
import sys
import json
import matplotlib
matplotlib.use('Agg')  # Backend sin GUI
import matplotlib.pyplot as plt
import numpy as np
import os

def crear_grafico_lineas(output_path):
    """Crear gráfico de líneas"""
    try:
        x = np.linspace(0, 10, 100)
        y1 = np.sin(x)
        y2 = np.cos(x)
        
        plt.figure(figsize=(10, 6))
        plt.plot(x, y1, label='sin(x)', linewidth=2)
        plt.plot(x, y2, label='cos(x)', linewidth=2)
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.title('Gráfico de Líneas - Sin y Cos')
        plt.legend()
        plt.grid(True)
        
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        return {
            "success": True,
            "type": "line",
            "output": output_path,
            "size": os.path.getsize(output_path),
            "matplotlib_version": matplotlib.__version__
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def crear_grafico_barras(output_path):
    """Crear gráfico de barras"""
    try:
        categorias = ['A', 'B', 'C', 'D', 'E']
        valores = [23, 45, 56, 78, 32]
        
        plt.figure(figsize=(10, 6))
        plt.bar(categorias, valores, color='skyblue', edgecolor='navy')
        plt.xlabel('Categorías')
        plt.ylabel('Valores')
        plt.title('Gráfico de Barras')
        plt.grid(axis='y', alpha=0.3)
        
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        return {
            "success": True,
            "type": "bar",
            "output": output_path,
            "size": os.path.getsize(output_path)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def crear_grafico_dispersion(output_path):
    """Crear gráfico de dispersión"""
    try:
        np.random.seed(42)
        x = np.random.randn(100)
        y = 2 * x + np.random.randn(100) * 0.5
        
        plt.figure(figsize=(10, 6))
        plt.scatter(x, y, alpha=0.6, c=y, cmap='viridis')
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.title('Gráfico de Dispersión')
        plt.colorbar(label='Valor Y')
        plt.grid(True, alpha=0.3)
        
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        return {
            "success": True,
            "type": "scatter",
            "output": output_path,
            "size": os.path.getsize(output_path)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def crear_grafico_pastel(output_path):
    """Crear gráfico de pastel"""
    try:
        labels = ['Python', 'JavaScript', 'Java', 'C++', 'Otros']
        sizes = [35, 25, 20, 15, 5]
        colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#ff99cc']
        
        plt.figure(figsize=(10, 8))
        plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
        plt.title('Distribución de Lenguajes de Programación')
        plt.axis('equal')
        
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        return {
            "success": True,
            "type": "pie",
            "output": output_path,
            "size": os.path.getsize(output_path)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    tipo = sys.argv[1] if len(sys.argv) > 1 else "lineas"
    output = sys.argv[2] if len(sys.argv) > 2 else f"test_matplotlib_{tipo}.png"
    
    if tipo == "barras":
        resultado = crear_grafico_barras(output)
    elif tipo == "dispersion":
        resultado = crear_grafico_dispersion(output)
    elif tipo == "pastel":
        resultado = crear_grafico_pastel(output)
    else:
        resultado = crear_grafico_lineas(output)
    
    print(json.dumps(resultado, indent=2))
