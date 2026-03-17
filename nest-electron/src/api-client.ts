import { net } from "electron";

const API_BASE_URL = "http://localhost:3000";

export class ApiClient {
  /**
   * Obtiene el token JWT del localStorage del renderer process
   * Nota: Esto requiere que el token esté disponible en el contexto de Electron
   */
  private static getAuthToken(): string | null {
    // El token debe ser pasado desde el renderer process
    // Por ahora retornamos null, pero se debe implementar un mecanismo
    // para obtener el token desde el renderer
    return null;
  }

  /**
   * Realiza una petición GET
   */
  static async get(endpoint: string, token?: string): Promise<any> {
    return this.request("GET", endpoint, undefined, token);
  }

  /**
   * Realiza una petición POST
   */
  static async post(
    endpoint: string,
    data?: any,
    token?: string,
  ): Promise<any> {
    return this.request("POST", endpoint, data, token);
  }

  /**
   * Método genérico para hacer peticiones HTTP
   */
  private static async request(
    method: string,
    endpoint: string,
    data?: any,
    token?: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = `${API_BASE_URL}${endpoint}`;

      const request = net.request({
        method,
        url,
      });

      // Agregar Content-Type si hay data
      if (data) {
        request.setHeader("Content-Type", "application/json");
      }

      // ✅ Agregar Authorization header si hay token
      if (token) {
        request.setHeader("Authorization", `Bearer ${token}`);
      }

      let responseData = "";

      request.on("response", (response) => {
        response.on("data", (chunk) => {
          responseData += chunk.toString();
        });

        response.on("end", () => {
          try {
            const parsed = JSON.parse(responseData);
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(parsed);
            } else {
              reject({
                status: response.statusCode,
                data: parsed,
              });
            }
          } catch (error) {
            reject({
              error: "Failed to parse response",
              raw: responseData,
            });
          }
        });

        response.on("error", (error: { message: any }) => {
          reject({
            error: "Response error",
            message: error.message,
          });
        });
      });

      request.on("error", (error) => {
        reject({
          error: "Request error",
          message: error.message,
        });
      });

      if (data) {
        request.write(JSON.stringify(data));
      }

      request.end();
    });
  }

  // ==========================================
  // AGREGA TUS MÉTODOS PYTHON AQUÍ ⬇️
  // ==========================================

  // Ejemplo GET:
  // static async pythonTuFuncion(param1: string, token?: string): Promise<any> {
  //   return this.get(`/python/tu-endpoint?param1=${param1}`, token);
  // }

  // Ejemplo POST:
  // static async pythonTuFuncion(param1: string, param2: number, token?: string): Promise<any> {
  //   return this.post("/python/tu-endpoint", { param1, param2 }, token);
  // }

  static async pythonSaludar(nombre: string, token?: string): Promise<any> {
    return this.get(
      `/python/saludar?nombre=${encodeURIComponent(nombre)}`,
      token,
    );
  }

  static async pythonGenerarPDF(
    datos: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
    },
    token?: string,
  ): Promise<any> {
    return this.post("/python/generar-pdf", datos, token);
  }

  static async pythonGenerarPathPDF(
    datos: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
      ruta_salida: string;
    },
    token?: string,
  ): Promise<any> {
    return this.post("/python/generar-path-pdf", datos, token);
  }

  static async pythonGuardarPdfRelativo(
    datos: {
      output_path: string;
      relative_path: string;
      input_path: string;
    },
    token?: string,
  ): Promise<any> {
    return this.post("/python/guardar-pdf-relativo", datos, token);
  }
}
