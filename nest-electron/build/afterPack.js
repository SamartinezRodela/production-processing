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
  console.log("AFTERPACK HOOK: Copiando archivos Python y configurando JWT");
  console.log("============================================================");
  console.log("");

  const platform = context.electronPlatformName;
  console.log(`Platform: ${platform}`);

  // ==========================================
  // 1. CREAR ARCHIVO .env PARA BACKEND
  // ==========================================
  console.log("");
  console.log("Creating .env file for backend...");

  const backendPath = path.join(context.appOutDir, "resources/backend");
  await fs.ensureDir(backendPath);

  const jwtSecret =
    process.env.JWT_SECRET ||
    "default-secret-change-in-production-min-32-chars";
  const jwtExpiration = process.env.JWT_EXPIRATION || "12h";
  const nodeEnv = process.env.NODE_ENV || "production";

  const envContent = `# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRATION=${jwtExpiration}

# Application
NODE_ENV=${nodeEnv}
PORT=3000
`;

  const envPath = path.join(backendPath, ".env");
  await fs.writeFile(envPath, envContent, "utf-8");

  console.log(`[OK] .env file created at: ${envPath}`);
  console.log(
    `JWT_SECRET: ${jwtSecret.substring(0, 10)}... (${jwtSecret.length} chars)`,
  );
  console.log(`JWT_EXPIRATION: ${jwtExpiration}`);
  console.log("");

  // ==========================================
  // 2. COPIAR ARCHIVOS PYTHON
  // ==========================================

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
    console.error("");
    console.error("Available directories:");
    const parentDir = path.resolve(__dirname, "../..");
    const dirs = fs.readdirSync(parentDir).filter((f) => {
      return fs.statSync(path.join(parentDir, f)).isDirectory();
    });
    console.error(dirs.join(", "));
    throw new Error("Python source directory not found");
  }

  // Verificar que tiene contenido
  const sourceFiles = fs.readdirSync(pythonSource);
  console.log(`Source directory contains ${sourceFiles.length} items`);
  console.log("Key items:", sourceFiles.slice(0, 10).join(", "));
  console.log("");

  // Verificar específicamente Lib/site-packages
  const libPath = path.join(pythonSource, "Lib", "site-packages");
  if (fs.existsSync(libPath)) {
    const packages = fs.readdirSync(libPath);
    console.log(`Found ${packages.length} packages in site-packages`);
    console.log("Sample packages:", packages.slice(0, 15).join(", "));
  } else {
    console.error("WARNING: Lib/site-packages not found in source!");
  }
  console.log("");

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
        preserveTimestamps: true,
        dereference: true,
        filter: (src) => {
          // Solo excluir __pycache__ y get-pip.py
          const basename = path.basename(src);
          if (basename === "__pycache__") return false;
          if (basename === "get-pip.py") return false;
          // Copiar TODO lo demás (incluyendo .py y .pyc)
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

      // Verificar que Lib/site-packages se copió
      const destLibPath = path.join(pythonDest, "Lib", "site-packages");
      if (fs.existsSync(destLibPath)) {
        const destPackages = fs.readdirSync(destLibPath);
        console.log(`Packages in destination: ${destPackages.length}`);
        console.log("Sample packages:", destPackages.slice(0, 15).join(", "));
      } else {
        console.error(
          "ERROR: Lib/site-packages was NOT copied to destination!",
        );
      }
      console.log("");
    } catch (error) {
      retries--;
      console.error(`[ERROR] Copy failed: ${error.message}`);
      console.error(`Stack: ${error.stack}`);

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
