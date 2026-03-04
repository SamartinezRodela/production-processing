import * as net from "net";

/**
 * Encuentra un puerto disponible en el rango especificado
 * @param startPort Puerto inicial (default: 3000)
 * @param endPort Puerto final (default: 3010)
 * @returns Promise con el puerto disponible o null si no hay ninguno
 */

export async function findAvailablePort(
  startPort: number = 3000,
  endPort: number = 3010,
): Promise<number | null> {
  for (let port = startPort; port <= endPort; port++) {
    const isAvailable = await isPortAvailable(port);
    if (isAvailable) {
      console.log(`Puerto ${port} esta disponible`);
      return port;
    } else {
      console.log(` Puerto ${port} está ocupado, intentando siguiente...`);
    }
  }

  console.error(
    ` No se encontró ningún puerto disponible entre ${startPort} y ${endPort}`,
  );
  return null;
}

/**
 * Verifica si un puerto específico está disponible
 * @param port Puerto a verificar
 * @returns Promise<boolean> true si está disponible
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        resolve(false); // Puerto ocupado
      } else {
        resolve(false); // Otro error, asumir no disponible
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true); // Puerto disponible
    });

    server.listen(port, "127.0.0.1");
  });
}
