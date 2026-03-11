/**
 * Electron Builder afterPack Hook
 * Copia los archivos de Python DESPUÉS de que Electron Builder termine
 * Esto evita el error EBUSY con archivos .pyd y .dll bloqueados
 */

const fs = require("fs-extra");
const path = require("path");

exports.default = async function (context) {
  console.log("");
  console.log("============================================================");
  console.log("AFTERPACK HOOK: Copiando archivos Python");
  console.log("============================================================");
  console.log("");

  const platform = context.electronPlatformName;
  console.log(`Platform: ${platform}`);

  // Determinar rutas según la plataforma
  let pythonSource, pythonDest;

  if (platform === "win32") {
    // Usar path.resolve desde __dirname para obtener la ruta correcta
    pythonSource = path.resolve(__dirname, "../../nest-files-py-embedded");
    pythonDest = path.join(context.appOutDir, "resources/python");
  } else if (platform === "darwin") {
    pythonSource = path.resolve(__dirname, "../../nest-files-py-embedded-mac");
    pythonDest = path.join(context.appOutDir, "resources/python");
  } else {
    console.log("Platform not supported for Python embedding");
    return;
  }

  console.log(`Source: ${pythonSource}`);
  console.log(`Destination: ${pythonDest}`);
  console.log("");

  // Verificar que el directorio fuente existe
  if (!fs.existsSync(pythonSource)) {
    console.error(`ERROR: Python source directory not found: ${pythonSource}`);
    throw new Error("Python source directory not found");
  }

  // Esperar antes de copiar para asegurar que los archivos estén liberados
  console.log("Waiting 15 seconds for file handles to be released...");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Crear directorio destino si no existe
  await fs.ensureDir(pythonDest);

  // Copiar con reintentos
  const maxRetries = 5;
  let retries = maxRetries;
  let success = false;

  while (retries > 0 && !success) {
    try {
      console.log(
        `Copying Python files... (attempt ${maxRetries - retries + 1}/${maxRetries})`,
      );

      await fs.copy(pythonSource, pythonDest, {
        overwrite: true,
        errorOnExist: false,
        filter: (src) => {
          // Excluir archivos innecesarios
          const basename = path.basename(src);
          if (basename === "get-pip.py") return false;
          if (basename === "__pycache__") return false;
          if (src.endsWith(".py") && !src.endsWith(".pyc")) {
            // Excluir .py pero permitir .pyc
            return false;
          }
          return true;
        },
      });

      success = true;
      console.log("");
      console.log("[OK] Python files copied successfully!");
      console.log("");

      // Contar archivos copiados
      const fileCount = await countFiles(pythonDest);
      console.log(`Total files copied: ${fileCount}`);
      console.log("");
    } catch (error) {
      retries--;
      console.error(`[ERROR] Copy failed: ${error.message}`);

      if (retries === 0) {
        console.error("[FATAL] Maximum retries reached");
        throw error;
      }

      console.log(`Retrying in 10 seconds... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  console.log("============================================================");
  console.log("AFTERPACK HOOK: Completed");
  console.log("============================================================");
  console.log("");
};

/**
 * Cuenta recursivamente los archivos en un directorio
 */
async function countFiles(dir) {
  let count = 0;

  async function walk(directory) {
    const files = await fs.readdir(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        await walk(filePath);
      } else {
        count++;
      }
    }
  }

  await walk(dir);
  return count;
}
