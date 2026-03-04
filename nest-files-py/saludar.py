import sys
import json
from datetime import datetime

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "Se requiere un nombre"}))
            sys.exit(1)

        nombre = sys.argv[1]

        result = {
            "success": True,
            "mensaje": f"!Hola {nombre}! Bienvenido",
            "timestamp": datetime.now().isoformat()
        }

        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()