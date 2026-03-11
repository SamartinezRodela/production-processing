"""
Test: SciPy - Funciones científicas avanzadas
"""
import sys
import json
import numpy as np
from scipy import stats, optimize, signal

def test_estadisticas():
    """Probar funciones estadísticas"""
    try:
        datos = np.random.normal(100, 15, 100)
        
        return {
            "success": True,
            "scipy_version": stats.__version__ if hasattr(stats, '__version__') else "N/A",
            "statistics": {
                "mean": float(np.mean(datos)),
                "median": float(np.median(datos)),
                "std": float(np.std(datos)),
                "skewness": float(stats.skew(datos)),
                "kurtosis": float(stats.kurtosis(datos))
            },
            "tests": {
                "normaltest": {
                    "statistic": float(stats.normaltest(datos)[0]),
                    "pvalue": float(stats.normaltest(datos)[1])
                }
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    resultado = test_estadisticas()
    print(json.dumps(resultado, indent=2))
