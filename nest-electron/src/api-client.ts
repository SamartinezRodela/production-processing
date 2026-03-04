import { net } from "electron";

const API_BASE_URL = "http://localhost:3000";

export class ApiClient {
  /**
   * Realiza una petición GET
   */
  static async get(endpoint: string): Promise<any> {
    return this.request("GET", endpoint);
  }

  /**
   * Realiza una petición POST
   */
  static async post(endpoint: string, data?: any): Promise<any> {
    return this.request("POST", endpoint, data);
  }

  /**
   * Método genérico para hacer peticiones HTTP
   */
  private static async request(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = `${API_BASE_URL}${endpoint}`;

      const request = net.request({
        method,
        url,
      });

      if (data) {
        request.setHeader("Content-Type", "application/json");
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
  // static async pythonTuFuncion(param1: string): Promise<any> {
  //   return this.get(`/python/tu-endpoint?param1=${param1}`);
  // }

  // Ejemplo POST:
  // static async pythonTuFuncion(param1: string, param2: number): Promise<any> {
  //   return this.post("/python/tu-endpoint", { param1, param2 });
  // }

  static async pythonSaludar(nombre: string): Promise<any> {
    return this.get(`/python/saludar?nombre=${encodeURIComponent(nombre)}`);
  }

  static async pythonGenerarPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }): Promise<any> {
    return this.post("/python/generar-pdf", datos);
  }

  static async pythonGenerarPathPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
    ruta_salida: string;
  }): Promise<any> {
    return this.post("/python/generar-path-pdf", datos);
  }
}
