"""
Test: NumPy y Pandas - Análisis de datos
"""
import sys
import json
import numpy as np
import pandas as pd

def test_numpy():
    """Probar NumPy"""
    try:
        # Crear arrays
        arr1 = np.array([1, 2, 3, 4, 5])
        arr2 = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
        
        # Operaciones
        resultado = {
            "success": True,
            "numpy_version": np.__version__,
            "arrays": {
                "arr1": arr1.tolist(),
                "arr2": arr2.tolist()
            },
            "operations": {
                "sum": float(np.sum(arr1)),
                "mean": float(np.mean(arr1)),
                "std": float(np.std(arr1)),
                "max": float(np.max(arr1)),
                "min": float(np.min(arr1)),
                "matrix_sum": float(np.sum(arr2)),
                "matrix_mean": float(np.mean(arr2))
            },
            "random": {
                "normal": np.random.normal(100, 15, 10).tolist(),
                "uniform": np.random.uniform(0, 1, 10).tolist()
            }
        }
        
        return resultado
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def test_pandas():
    """Probar Pandas"""
    try:
        # Crear DataFrame
        data = {
            'Nombre': ['Ana', 'Juan', 'María', 'Pedro', 'Lucía'],
            'Edad': [25, 30, 28, 35, 27],
            'Ciudad': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'],
            'Salario': [30000, 45000, 38000, 52000, 41000]
        }
        
        df = pd.DataFrame(data)
        
        resultado = {
            "success": True,
            "pandas_version": pd.__version__,
            "dataframe": {
                "shape": df.shape,
                "columns": df.columns.tolist(),
                "data": df.to_dict('records')
            },
            "statistics": {
                "edad_promedio": float(df['Edad'].mean()),
                "salario_promedio": float(df['Salario'].mean()),
                "salario_max": float(df['Salario'].max()),
                "salario_min": float(df['Salario'].min())
            },
            "groupby": {
                "por_ciudad": df.groupby('Ciudad')['Salario'].mean().to_dict()
            }
        }
        
        return resultado
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def test_combinado():
    """Probar NumPy y Pandas juntos"""
    try:
        # Crear datos con NumPy
        datos = np.random.randint(1, 100, (10, 3))
        
        # Convertir a DataFrame
        df = pd.DataFrame(datos, columns=['A', 'B', 'C'])
        
        # Operaciones
        df['Suma'] = df.sum(axis=1)
        df['Promedio'] = df[['A', 'B', 'C']].mean(axis=1)
        
        resultado = {
            "success": True,
            "dataframe": df.to_dict('records'),
            "statistics": {
                "total_suma": float(df['Suma'].sum()),
                "promedio_general": float(df['Promedio'].mean())
            }
        }
        
        return resultado
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "pandas":
        resultado = test_pandas()
    elif len(sys.argv) > 1 and sys.argv[1] == "combinado":
        resultado = test_combinado()
    else:
        resultado = test_numpy()
    
    print(json.dumps(resultado, indent=2))
