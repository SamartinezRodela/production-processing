import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name);

  /**
   * 🔒 WHITELIST DE HASHES SHA-256
   * Estos hashes verifican la integridad de los archivos .pyc
   * Se cargan desde python-hashes.json generado durante el build
   */
  private HASHES_WHITELIST: Record<string, string> = {};

  constructor() {
    this.loadHashesWhitelist();
  }

  /**
   * Carga los hashes desde el archivo python-hashes.json
   */
  private loadHashesWhitelist(): void {
    try {
      // Intentar cargar desde la ubicación de producción
      const resourcesPath =
        process.env.RESOURCES_PATH || (process as any).resourcesPath;

      let hashesPath: string;

      if (resourcesPath) {
        // Producción: cargar desde resources/backend
        hashesPath = path.join(resourcesPath, 'backend', 'python-hashes.json');
      } else {
        // Desarrollo: cargar desde la raíz del proyecto
        hashesPath = path.resolve(__dirname, '../../../python-hashes.json');
      }

      if (fs.existsSync(hashesPath)) {
        const hashesData = fs.readFileSync(hashesPath, 'utf8');
        this.HASHES_WHITELIST = JSON.parse(hashesData);
        this.logger.log(`✅ Hashes cargados desde: ${hashesPath}`);
        this.logger.log(
          `   Archivos en whitelist: ${Object.keys(this.HASHES_WHITELIST).length}`,
        );
      } else {
        this.logger.warn(
          `⚠️  Archivo python-hashes.json no encontrado en: ${hashesPath}`,
        );
        this.logger.warn(
          '   La verificación de integridad estará deshabilitada',
        );
      }
    } catch (error) {
      this.logger.error(`❌ Error cargando hashes: ${error.message}`);
      this.logger.warn('   La verificación de integridad estará deshabilitada');
    }
  }

  /**
   * Obtiene la ruta del ejecutable Python según el entorno
   */
  private getPythonExecutable(): string {
    const resourcesPath =
      process.env.RESOURCES_PATH || (process as any).resourcesPath;

    if (resourcesPath) {
      // Producción: usar Python embebido
      const isMac = process.platform === 'darwin';
      const isWindows = process.platform === 'win32';

      if (isMac) {
        const pythonExe = path.join(
          resourcesPath,
          'python',
          'python-runtime',
          'bin',
          'python3',
        );
        this.logger.log(`Modo PRODUCCIÓN (Mac) - Python: ${pythonExe}`);
        return pythonExe;
      } else if (isWindows) {
        const pythonExe = path.join(resourcesPath, 'python', 'python.exe');
        this.logger.log(`Modo PRODUCCIÓN (Windows) - Python: ${pythonExe}`);
        return pythonExe;
      }
    }

    // Desarrollo: usar Python embebido local
    const isMac = process.platform === 'darwin';
    if (isMac) {
      const devPath = path.resolve(
        __dirname,
        '../../../nest-files-py-embedded-mac/python-runtime/bin/python3',
      );
      this.logger.log(`Modo DESARROLLO (Mac) - Python: ${devPath}`);
      return devPath;
    } else {
      const devPath = path.resolve(
        __dirname,
        '../../../nest-files-py-embedded/python.exe',
      );
      this.logger.log(`Modo DESARROLLO (Windows) - Python: ${devPath}`);
      return devPath;
    }
  }

  // Calcula la ruta correcta según el entorno
  private readonly scriptsPath = this.getScriptsPath();

  /**
   * 🔒 Verifica la integridad de un archivo .pyc
   * Calcula el hash SHA-256 y lo compara con la whitelist
   *
   * @param fileName - Nombre del archivo .pyc a verificar
   * @returns true si el archivo es válido, false si está modificado o no existe
   */
  private verifyFileIntegrity(fileName: string): boolean {
    const filePath = path.join(this.scriptsPath, fileName);

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      this.logger.error(`❌ INTEGRIDAD: Archivo no encontrado: ${fileName}`);
      this.logger.error(`   Ruta esperada: ${filePath}`);
      return false;
    }

    // Verificar que tenemos el hash en la whitelist
    if (!this.HASHES_WHITELIST[fileName]) {
      this.logger.warn(
        `⚠️  INTEGRIDAD: Archivo no está en whitelist: ${fileName}`,
      );
      this.logger.warn(
        `   Esto puede ser normal si es un archivo .py sin compilar`,
      );
      return true; // Permitir archivos no listados (para desarrollo)
    }

    // Calcular hash del archivo
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const expectedHash = this.HASHES_WHITELIST[fileName];

      if (hash !== expectedHash) {
        this.logger.error(`❌ INTEGRIDAD COMPROMETIDA: ${fileName}`);
        this.logger.error(`   Hash esperado: ${expectedHash}`);
        this.logger.error(`   Hash actual:   ${hash}`);
        this.logger.error(`   ⚠️  El archivo ha sido modificado o reemplazado`);
        return false;
      }

      this.logger.log(`✅ INTEGRIDAD OK: ${fileName}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ INTEGRIDAD: Error leyendo archivo ${fileName}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Obtiene la ruta de los scripts Python según el entorno
   * - Desarrollo: nest-files-py-embedded en la raíz del proyecto
   * - Producción: resources/python en la carpeta de instalación
   */
  private getScriptsPath(): string {
    // Detectar si está en producción (empaquetado con Electron)
    const resourcesPath =
      process.env.RESOURCES_PATH || (process as any).resourcesPath;

    if (resourcesPath) {
      // Producción: usar carpeta resources/python
      const prodPath = path.join(resourcesPath, 'python');
      this.logger.log(`Modo PRODUCCIÓN - Scripts path: ${prodPath}`);
      return prodPath;
    } else {
      // Desarrollo: usar carpeta nest-files-py-embedded relativa
      const isMac = process.platform === 'darwin';
      const devPath = isMac
        ? path.resolve(__dirname, '../../../nest-files-py-embedded-mac')
        : path.resolve(__dirname, '../../../nest-files-py-embedded');
      this.logger.log(`Modo DESARROLLO - Scripts path: ${devPath}`);
      return devPath;
    }
  }

  /**
   * Ejecuta un script Python y retorna el resultado como JSON
   *
   * @param scriptName - Nombre del archivo Python (ej: 'mi_script.py' o 'mi_script.pyc')
   * @param args - Array de argumentos para pasar al script
   * @returns Promise con el resultado parseado como JSON
   */
  async executeScript(scriptName: string, args: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      // 🔒 PASO 1: Convertir .py a .pyc si es necesario
      let finalScriptName = scriptName;
      if (scriptName.endsWith('.py')) {
        finalScriptName = scriptName.replace('.py', '.pyc');
        this.logger.log(`🔄 Convirtiendo ${scriptName} → ${finalScriptName}`);
      }

      // 🔒 PASO 2: Verificar integridad del archivo
      if (!this.verifyFileIntegrity(finalScriptName)) {
        const error = {
          error: 'Integrity check failed',
          message: 'El archivo ha sido modificado o no existe',
          fileName: finalScriptName,
          hint: '🔒 Error de integridad del sistema. Por favor reinstala la aplicación.',
        };
        this.logger.error(`🚫 EJECUCIÓN BLOQUEADA: ${finalScriptName}`);
        reject(error);
        return;
      }

      // 🔒 PASO 3: Ejecutar el script si pasó la verificación
      const pythonExe = this.getPythonExecutable();
      const scriptPath = path.join(this.scriptsPath, finalScriptName);

      this.logger.log(`Scripts path: ${this.scriptsPath}`);
      this.logger.log(`Python executable: ${pythonExe}`);
      this.logger.log(`Script completo: ${scriptPath}`);
      this.logger.log(
        `Ejecutando: ${pythonExe} ${scriptPath} con args: ${args.join(' ')}`,
      );

      const pythonProcess = spawn(pythonExe, [scriptPath, ...args]);

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        this.logger.warn(`Python stderr: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Python script salió con código ${code}`);
          this.logger.error(`Error: ${errorString}`);

          // Mensaje específico para Python embebido no encontrado
          const hint =
            code === 9009 || errorString.includes('not found')
              ? '💡 Python embebido no encontrado. Verifica que nest-files-py-embedded esté correctamente configurado.'
              : 'Error ejecutando el script Python';

          this.logger.error(hint);

          reject({
            error: 'Python script failed',
            code,
            stderr: errorString,
            stdout: dataString,
            hint,
          });
          return;
        }

        try {
          const result = JSON.parse(dataString);
          this.logger.log('Script ejecutado exitosamente');
          resolve(result);
        } catch (error) {
          this.logger.error('Error parseando JSON de Python');
          reject({
            error: 'Failed to parse Python output',
            output: dataString,
            parseError: error.message,
          });
        }
      });

      pythonProcess.on('error', (error) => {
        this.logger.error(`Error ejecutando Python: ${error.message}`);
        this.logger.error(
          '💡 Verifica que Python embebido esté correctamente configurado en nest-files-py-embedded',
        );
        reject({
          error: 'Failed to start Python process',
          message: error.message,
          hint: 'Verifica que Python embebido esté correctamente configurado',
        });
      });
    });
  }

  // ==========================================
  // AGREGA TUS MÉTODOS AQUÍ ⬇️
  // ==========================================

  // Ejemplo:
  // async tuFuncion(param1: string, param2: number): Promise<any> {
  //   return this.executeScript('tu_script.py', [param1, param2.toString()]);
  // }

  async saludar(nombre: string): Promise<any> {
    return this.executeScript('saludar.py', [nombre]);
  }

  async generarPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }): Promise<any> {
    const datosJson = JSON.stringify(datos);
    return this.executeScript('generar_pdf.py', [datosJson]);
  }

  async generarPathPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
    ruta_salida: string;
  }): Promise<any> {
    const datosJson = JSON.stringify(datos);
    return this.executeScript('generar_pdf_path.py', [datosJson]);
  }
  /**
   * Ejecuta un archivo ejecutable .exe y retorna el resultado como JSON
   *
   * @param exeName - Nombre del archivo ejecutable (ej: 'mi_programa.exe')
   * @param args - Array de argumentos para pasar al ejecutable
   * @returns Promise con el resultado parseado como JSON
   */
  async executeExecutable(exeName: string, args: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const executablesPath = path.join(this.scriptsPath, 'executables');
      const exePath = path.join(executablesPath, exeName);

      this.logger.log(`Executables path: ${executablesPath}`);
      this.logger.log(`Ejecutable completo: ${exePath}`);
      this.logger.log(`Ejecutando: ${exePath} con args: ${args.join(' ')}`);

      const exeProcess = spawn(exePath, args);

      let dataString = '';
      let errorString = '';

      exeProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      exeProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        this.logger.warn(`Executable stderr: ${data}`);
      });

      exeProcess.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Ejecutable salió con código ${code}`);
          this.logger.error(`Error: ${errorString}`);

          const hint =
            code === 9009 || errorString.includes('not found')
              ? '💡 Ejecutable no encontrado. Verifica que el archivo .exe esté en la carpeta executables.'
              : 'Error ejecutando el ejecutable';

          this.logger.error(hint);

          reject({
            error: 'Executable failed',
            code,
            stderr: errorString,
            stdout: dataString,
            hint,
          });
          return;
        }

        try {
          const result = JSON.parse(dataString);
          this.logger.log('Ejecutable ejecutado exitosamente');
          resolve(result);
        } catch (error) {
          this.logger.error('Error parseando JSON del ejecutable');
          reject({
            error: 'Failed to parse executable output',
            output: dataString,
            parseError: error.message,
          });
        }
      });

      exeProcess.on('error', (error) => {
        this.logger.error(`Error ejecutando ejecutable: ${error.message}`);
        this.logger.error(
          '💡 Verifica que el archivo .exe esté en la carpeta executables y tenga permisos de ejecución',
        );
        reject({
          error: 'Failed to start executable process',
          message: error.message,
          hint: 'Verifica que el ejecutable esté correctamente configurado',
        });
      });
    });
  }

  /**
   * Ejecuta un archivo (detecta automáticamente si es .py o .exe)
   *
   * @param fileName - Nombre del archivo con extensión (ej: 'script.py' o 'programa.exe')
   * @param args - Array de argumentos para pasar al archivo
   * @returns Promise con el resultado parseado como JSON
   */
  async executeFile(fileName: string, args: string[] = []): Promise<any> {
    const extension = path.extname(fileName).toLowerCase();

    this.logger.log(`Detectando tipo de archivo: ${fileName} (${extension})`);

    if (extension === '.py') {
      this.logger.log('Ejecutando como script Python');
      return this.executeScript(fileName, args);
    } else if (extension === '.exe') {
      this.logger.log('Ejecutando como ejecutable');
      return this.executeExecutable(fileName, args);
    } else {
      const error = `Tipo de archivo no soportado: ${extension}. Solo se permiten .py y .exe`;
      this.logger.error(error);
      throw new Error(error);
    }
  }

  /**
   * Obtiene información de debug sobre las rutas
   */
  getDebugInfo(): any {
    const resourcesPath =
      process.env.RESOURCES_PATH || (process as any).resourcesPath;
    return {
      scriptsPath: this.scriptsPath,
      executablesPath: path.join(this.scriptsPath, 'executables'),
      pythonExecutable: this.getPythonExecutable(),
      resourcesPath: resourcesPath || 'No definido (modo desarrollo)',
      resourcesPathEnv: process.env.RESOURCES_PATH || 'No definido',
      __dirname: __dirname,
      platform: process.platform,
      isProduction: !!resourcesPath,
    };
  }

  /**
   * 🔒 Verifica la integridad de todos los archivos en la whitelist
   * Útil para diagnóstico y testing
   */
  verifyAllFiles(): any {
    const results: Record<string, any> = {};

    for (const fileName of Object.keys(this.HASHES_WHITELIST)) {
      const filePath = path.join(this.scriptsPath, fileName);
      const exists = fs.existsSync(filePath);

      if (!exists) {
        results[fileName] = {
          status: 'missing',
          exists: false,
          path: filePath,
        };
        continue;
      }

      try {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto
          .createHash('sha256')
          .update(fileBuffer)
          .digest('hex');
        const expectedHash = this.HASHES_WHITELIST[fileName];
        const valid = hash === expectedHash;

        results[fileName] = {
          status: valid ? 'valid' : 'modified',
          exists: true,
          valid: valid,
          path: filePath,
          expectedHash: expectedHash,
          actualHash: hash,
        };
      } catch (error) {
        results[fileName] = {
          status: 'error',
          exists: true,
          error: error.message,
          path: filePath,
        };
      }
    }

    return {
      scriptsPath: this.scriptsPath,
      totalFiles: Object.keys(this.HASHES_WHITELIST).length,
      results: results,
    };
  }
}
