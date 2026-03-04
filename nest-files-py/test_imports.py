import sys
import json

def test_imports():
    """Verifica que todas las dependencias estén instaladas"""
    results = {
        "python_version": sys.version,
        "python_executable": sys.executable,
        "imports": {}
    }
    
    # Probar importar reportlab
    try:
        import reportlab
        results["imports"]["reportlab"] = {
            "installed": True,
            "version": reportlab.Version if hasattr(reportlab, 'Version') else "unknown"
        }
    except ImportError as e:
        results["imports"]["reportlab"] = {
            "installed": False,
            "error": str(e)
        }
    
    # Probar importar reportlab.pdfgen
    try:
        from reportlab.pdfgen import canvas
        results["imports"]["reportlab.pdfgen"] = {
            "installed": True
        }
    except ImportError as e:
        results["imports"]["reportlab.pdfgen"] = {
            "installed": False,
            "error": str(e)
        }
    
    # Probar importar reportlab.lib
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import inch
        results["imports"]["reportlab.lib"] = {
            "installed": True
        }
    except ImportError as e:
        results["imports"]["reportlab.lib"] = {
            "installed": False,
            "error": str(e)
        }
    
    return results

if __name__ == "__main__":
    result = test_imports()
    print(json.dumps(result, indent=2))
