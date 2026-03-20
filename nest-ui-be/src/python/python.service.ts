import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { SettingsService } from '../settings/settings.service';
import { PythonGateway } from './python.gateway';

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name);

  /**
   * WHITELIST DE HASHES SHA-256
   * Estos hashes verifican la integridad de los archivos .pyc
   * Se cargan desde python-hashes.json generado durante el build
   */
  private HASHES_WHITELIST: Record<string, string> = {};

  constructor(
    private readonly settingsService: SettingsService,
    private readonly pythonGateway: PythonGateway,
  ) {
    this.loadHashesWhitelist();
  }

  /**
   * Carga los hashes desde el archivo python-hashes.json
   * Si no existe, la verificación de integridad se deshabilitará
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
        this.logger.log(`SEGURIDAD: Verificación de integridad ACTIVA`);
        this.logger.log(`Hashes cargados desde: ${hashesPath}`);
        this.logger.log(
          `   Archivos protegidos: ${Object.keys(this.HASHES_WHITELIST).length}`,
        );
      } else {
        this.logger.warn(`SEGURIDAD: python-hashes.json no encontrado`);
        this.logger.warn(`Ruta buscada: ${hashesPath}`);
        this.logger.warn(
          `   Verificación de integridad DESHABILITADA (modo desarrollo)`,
        );
      }
    } catch (error) {
      this.logger.error(`Error cargando hashes: ${error.message}`);
      this.logger.warn(`Verificación de integridad DESHABILITADA`);
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
   * Construye la ruta completa de salida usando el outputPath de Settings
   * Si no hay outputPath configurado, lanza un error
   */
  private buildOutputPath(fileName: string): string {
    try {
      const settings = this.settingsService.getSettings();
      const outputPath = settings.outputPath;

      this.logger.log(`Checking outputPath: ${outputPath}`);

      // Validar que outputPath esté configurado
      if (!outputPath || outputPath.trim() === '') {
        const error =
          'OutputPath is not configured. Please configure it in Settings before running tests that generate files.';
        this.logger.error(`${error}`);
        throw new Error(error);
      }

      // Validar que outputPath exista
      if (!fs.existsSync(outputPath)) {
        const error = `OutputPath does not exist: ${outputPath}. Please create the directory or update the path in Settings.`;
        this.logger.error(`${error}`);
        throw new Error(error);
      }

      const fullPath = path.join(outputPath, fileName);
      this.logger.log(`Output file will be saved to: ${fullPath}`);
      return fullPath;
    } catch (error) {
      this.logger.error(`Error building output path: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica la integridad de un archivo .pyc
   * Calcula el hash SHA-256 y lo compara con la whitelist
   *
   * MODO DINÁMICO:
   * - Si python-hashes.json existe: Verifica integridad estricta
   * - Si NO existe: Permite ejecución sin verificación (modo desarrollo)
   *
   * @param fileName - Nombre del archivo .pyc a verificar
   * @returns true si el archivo es válido, false si está modificado o no existe
   */
  private verifyFileIntegrity(fileName: string): boolean {
    const filePath = path.join(this.scriptsPath, fileName);

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      this.logger.error(`INTEGRIDAD: Archivo no encontrado: ${fileName}`);
      this.logger.error(`   Ruta esperada: ${filePath}`);
      return false;
    }

    // Si no hay whitelist cargada, permitir ejecución (modo desarrollo)
    if (Object.keys(this.HASHES_WHITELIST).length === 0) {
      this.logger.warn(
        `MODO SIN VERIFICACIÓN: python-hashes.json no encontrado`,
      );
      this.logger.warn(`Permitiendo ejecución sin verificación de integridad`);
      return true;
    }

    // Verificar que tenemos el hash en la whitelist
    if (!this.HASHES_WHITELIST[fileName]) {
      this.logger.warn(`INTEGRIDAD: Archivo no está en whitelist: ${fileName}`);
      this.logger.warn(
        `Permitiendo ejecución (archivo no listado en python-hashes.json)`,
      );
      return true; // Permitir archivos no listados
    }

    // Calcular hash del archivo
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const expectedHash = this.HASHES_WHITELIST[fileName];

      if (hash !== expectedHash) {
        this.logger.error(`INTEGRIDAD COMPROMETIDA: ${fileName}`);
        this.logger.error(`Hash esperado: ${expectedHash}`);
        this.logger.error(`Hash actual:   ${hash}`);
        this.logger.error(`El archivo ha sido modificado o reemplazado`);
        return false;
      }

      this.logger.log(`INTEGRIDAD OK: ${fileName}`);
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
      const resourcesPath =
        process.env.RESOURCES_PATH || (process as any).resourcesPath;
      const isProduction = !!resourcesPath;

      // PASO 1: Convertir .py a .pyc si es necesario (solo en producción)
      let finalScriptName = scriptName;
      if (isProduction && scriptName.endsWith('.py')) {
        finalScriptName = scriptName.replace('.py', '.pyc');
        this.logger.log(`Convirtiendo ${scriptName} → ${finalScriptName}`);
      }

      // PASO 2: Verificar integridad del archivo (solo en producción)
      if (isProduction && !this.verifyFileIntegrity(finalScriptName)) {
        const error = {
          error: 'Integrity check failed',
          message: 'El archivo ha sido modificado o no existe',
          fileName: finalScriptName,
          hint: 'Error de integridad del sistema. Por favor reinstala la aplicación.',
        };
        this.logger.error(` EJECUCIÓN BLOQUEADA: ${finalScriptName}`);
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

      const TIMEOUT_MS = 60000;
      const timeoutId = setTimeout(() => {
        this.logger.error(
          `TIMEOUT: El script ${finalScriptName} excedió el límite de ${TIMEOUT_MS / 1000}s. Matando proceso...`,
        );
        pythonProcess.kill('SIGKILL');

        reject({
          error: 'Timeout exceeded',
          message: `El proceso excedió el tiempo límite de ${TIMEOUT_MS / 1000} segundos y fue cancelado.`,
        });
      }, TIMEOUT_MS);

      let dataString = '';
      let errorString = '';
      let stdoutBuffer = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');

        // Mantiene la última línea en el buffer si está incompleta (no termina en \n)
        stdoutBuffer = lines.pop() || '';

        for (const line of lines) {
          // Buscar marcador de progreso: ej. PROGRESS:50:some-file.pdf
          const progressMatch = line.match(/PROGRESS:(\d+):(.+)/);
          if (progressMatch) {
            const progressValue = parseInt(progressMatch[1], 10);
            const fileName = progressMatch[2].trim();
            this.pythonGateway.emitProgress(progressValue, {
              scriptName: finalScriptName,
              fileName: fileName,
            });
          } else {
            // Si no es un mensaje de progreso, acumularlo para el JSON final
            dataString += line + '\n';
          }
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        this.logger.warn(`Python stderr: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutId); // Limpiar timeout si terminó a tiempo

        // Procesar cualquier dato restante en el buffer
        if (stdoutBuffer) {
          const progressMatch = stdoutBuffer.match(/PROGRESS:(\d+):(.+)/);
          if (progressMatch) {
            const progressValue = parseInt(progressMatch[1], 10);
            const fileName = progressMatch[2].trim();
            this.pythonGateway.emitProgress(progressValue, {
              scriptName: finalScriptName,
              fileName: fileName,
            });
          } else {
            dataString += stdoutBuffer;
          }
        }

        if (code !== 0) {
          this.logger.error(`Python script salió con código ${code}`);
          this.logger.error(`Error: ${errorString}`);

          // Mensaje específico para Python embebido no encontrado
          const hint =
            code === 9009 || errorString.includes('not found')
              ? ' Python embebido no encontrado. Verifica que nest-files-py-embedded esté correctamente configurado.'
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
        clearTimeout(timeoutId); // Limpiar timeout si falló
        this.logger.error(`Error ejecutando Python: ${error.message}`);
        this.logger.error(
          'Verifica que Python embebido esté correctamente configurado en nest-files-py-embedded',
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
  // AGREGA TUS MÉTODOS AQUÍ
  // ==========================================

  // Ejemplo:
  // async tuFuncion(param1: string, param2: number): Promise<any> {
  //   return this.executeScript('tu_script.py', [param1, param2.toString()]);
  // }

  async saludar(nombre: string): Promise<any> {
    return this.executeFileWithFallback('saludar', [nombre]);
  }

  async generarPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
  }): Promise<any> {
    const datosJson = JSON.stringify(datos);
    return this.executeDispatcher('generar_pdf', [datosJson]);
  }

  async guardarPdfRelativo(datos: {
    output_path: string;
    relative_path: string;
    input_path: string;
  }): Promise<any> {
    const datosJson = JSON.stringify(datos);
    return this.executeFileWithFallback('guardar_pdf_path', [datosJson]);
  }

  async generarPathPDF(datos: {
    titulo: string;
    contenido: string;
    autor: string;
    nombre_archivo: string;
    ruta_salida: string;
  }): Promise<any> {
    const datosJson = JSON.stringify(datos);
    return this.executeDispatcher('generar_pdf_path', [datosJson]);
  }

  async saveMetadata(data: any): Promise<any> {
    try {
      const dataDir = this.getDataDirectory();

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, 'tabla_metadatos.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

      this.logger.log(`Metadata saved to: ${filePath}`);
      return { success: true, message: 'Metadata saved successfully' };
    } catch (error) {
      this.logger.error(`Error saving metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el directorio de datos según el entorno.
   * Producción: AppData/Roaming (Windows), ~/Library/Application Support (Mac), ~/.config (Linux)
   * Desarrollo: nest-ui-be/data
   */
  private getDataDirectory(): string {
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      (process as any).resourcesPath !== undefined;

    if (isProduction) {
      let userDataPath: string;

      if (process.platform === 'darwin') {
        userDataPath = path.join(
          process.env.HOME || '~',
          'Library',
          'Application Support',
        );
      } else if (process.platform === 'win32') {
        userDataPath =
          process.env.APPDATA ||
          path.join(process.env.HOME || '~', 'AppData', 'Roaming');
      } else {
        userDataPath = path.join(process.env.HOME || '~', '.config');
      }

      return path.join(userDataPath, 'Production Processing');
    } else {
      return path.resolve(__dirname, '../../data');
    }
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
      // Buscar el .exe primero en la raíz de scripts, luego en executables/
      let exePath = path.join(this.scriptsPath, exeName);
      if (!fs.existsSync(exePath)) {
        const executablesPath = path.join(this.scriptsPath, 'executables');
        exePath = path.join(executablesPath, exeName);
      }

      this.logger.log(`Ejecutable completo: ${exePath}`);
      this.logger.log(`Ejecutando: ${exePath} con args: ${args.join(' ')}`);

      if (!fs.existsSync(exePath)) {
        reject({
          error: 'Executable not found',
          message: `No se encontró el ejecutable: ${exeName}`,
          searchedPaths: [
            path.join(this.scriptsPath, exeName),
            path.join(this.scriptsPath, 'executables', exeName),
          ],
          hint: 'Verifica que el archivo .exe esté en la carpeta de scripts o en executables/',
        });
        return;
      }
      const exeProcess = spawn(exePath, args);

      const TIMEOUT_MS = 60000;
      const timeoutId = setTimeout(() => {
        this.logger.error(
          `⏳ TIMEOUT: El ejecutable ${exeName} excedió el límite de ${TIMEOUT_MS / 1000}s. Matando proceso...`,
        );
        exeProcess.kill('SIGKILL');
        reject({
          error: 'Timeout exceeded',
          message: `El proceso excedió el tiempo límite de ${TIMEOUT_MS / 1000} segundos y fue cancelado.`,
        });
      }, TIMEOUT_MS);

      let dataString = '';
      let errorString = '';
      let stdoutBuffer = '';

      exeProcess.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');

        // Mantiene la última línea en el buffer si está incompleta (no termina en \n)
        stdoutBuffer = lines.pop() || '';

        for (const line of lines) {
          // Buscar marcador de progreso: ej. PROGRESS:50:some-file.pdf
          const progressMatch = line.match(/PROGRESS:(\d+):(.+)/);
          if (progressMatch) {
            const progressValue = parseInt(progressMatch[1], 10);
            const fileName = progressMatch[2].trim();
            this.pythonGateway.emitProgress(progressValue, {
              scriptName: exeName,
              fileName: fileName,
            });
          } else {
            // Si no es un mensaje de progreso, acumularlo para el JSON final
            dataString += line + '\n';
          }
        }
      });

      exeProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        this.logger.warn(`Executable stderr: ${data}`);
      });

      exeProcess.on('close', (code) => {
        clearTimeout(timeoutId); // Limpiar timeout si terminó a tiempo

        // Procesar cualquier dato restante en el buffer
        if (stdoutBuffer) {
          const progressMatch = stdoutBuffer.match(/PROGRESS:(\d+):(.+)/);
          if (progressMatch) {
            const progressValue = parseInt(progressMatch[1], 10);
            const fileName = progressMatch[2].trim();
            this.pythonGateway.emitProgress(progressValue, {
              scriptName: exeName,
              fileName: fileName,
            });
          } else {
            dataString += stdoutBuffer;
          }
        }

        if (code !== 0) {
          this.logger.error(`Ejecutable salió con código ${code}`);
          this.logger.error(`Error: ${errorString}`);

          const hint =
            code === 9009 || errorString.includes('not found')
              ? 'Ejecutable no encontrado. Verifica que el archivo .exe esté en la carpeta executables.'
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
        clearTimeout(timeoutId); // Limpiar timeout si falló

        this.logger.error(`Error ejecutando ejecutable: ${error.message}`);
        this.logger.error(
          'Verifica que el archivo .exe esté en la carpeta executables y tenga permisos de ejecución',
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
  /**
   * Ejecuta un archivo intentando primero .exe (standalone) y si no existe, lanza error.
   * Grupo A: Scripts que solo usan stdlib, compilados a .exe con PyInstaller.
   *
   * @param baseName - Nombre base sin extensión (ej: 'saludar', 'guardar_pdf_path')
   * @param args - Array de argumentos
   * @returns Promise con el resultado parseado como JSON
   */
  async executeFileWithFallback(
    baseName: string,
    args: string[] = [],
  ): Promise<any> {
    const isMac = process.platform === 'darwin';
    const exeName = isMac ? baseName : `${baseName}.exe`;

    // Buscar .exe en raíz de scripts y en executables/
    const exePathRoot = path.join(this.scriptsPath, exeName);
    const exePathExecutables = path.join(
      this.scriptsPath,
      'executables',
      exeName,
    );

    if (fs.existsSync(exePathRoot)) {
      this.logger.log(`[EXE] Ejecutando ${exeName} desde raíz`);
      return this.executeExecutable(exeName, args);
    }

    if (fs.existsSync(exePathExecutables)) {
      this.logger.log(`[EXE] Ejecutando ${exeName} desde executables/`);
      return this.executeExecutable(exeName, args);
    }

    // En desarrollo: fallback a .py con Python embebido
    const pyName = `${baseName}.py`;
    const pyPath = path.join(this.scriptsPath, pyName);
    if (fs.existsSync(pyPath)) {
      this.logger.log(
        `[DEV Fallback] ${exeName} no encontrado, ejecutando ${pyName}`,
      );
      return this.executeScript(pyName, args);
    }

    throw new Error(
      `Ejecutable no encontrado: ${exeName}. Buscado en: ${exePathRoot}, ${exePathExecutables}`,
    );
  }

  /**
   * Ejecuta un comando a través del dispatcher (Grupo B).
   * El dispatcher es un .exe único que contiene todas las bibliotecas.
   * Si el dispatcher no existe, cae al script .py individual con Python embebido.
   *
   * @param comando - Nombre del comando (ej: 'generar_pdf', 'test_numpy_pandas')
   * @param args - Array de argumentos para el comando
   * @returns Promise con el resultado parseado como JSON
   */
  async executeDispatcher(comando: string, args: string[] = []): Promise<any> {
    const isMac = process.platform === 'darwin';
    const dispatcherName = isMac ? 'dispatcher' : 'dispatcher.exe';

    // Buscar dispatcher en executables/
    const dispatcherPath = path.join(
      this.scriptsPath,
      'executables',
      dispatcherName,
    );

    if (fs.existsSync(dispatcherPath)) {
      this.logger.log(
        `[Dispatcher] Ejecutando: ${dispatcherName} ${comando} ${args.join(' ')}`,
      );
      return this.executeExecutable(dispatcherName, [comando, ...args]);
    }

    // Fallback: mapear comando a script .py individual
    const scriptMap: Record<string, string> = {
      generar_pdf: 'generar_pdf.py',
      generar_pdf_path: 'generar_pdf_path.py',
      verify_folder: 'verify_folder.py',
      generate_pdf: 'generate_pdf.py',
      test_imports: 'test_imports.py',
      test_all_libraries: 'test_all_libraries.py',
      test_numpy_pandas: 'test_numpy_pandas.py',
      test_reportlab: 'test_reportlab.py',
      test_matplotlib: 'test_matplotlib.py',
      test_opencv: 'test_opencv.py',
      test_pillow: 'test_pillow.py',
      test_scipy: 'test_scipy.py',
      test_pypdf: 'test_pypdf.py',
      test_pymupdf: 'test_pymupdf.py',
      quick_test: 'quick_test.py',
      ejemplo_bibliotecas: 'ejemplo_bibliotecas.py',
    };

    const scriptName = scriptMap[comando];
    if (!scriptName) {
      throw new Error(`Comando dispatcher desconocido: ${comando}`);
    }

    const scriptPath = path.join(this.scriptsPath, scriptName);
    if (fs.existsSync(scriptPath)) {
      this.logger.log(
        `[DEV Fallback] dispatcher no encontrado, ejecutando ${scriptName}`,
      );
      return this.executeScript(scriptName, args);
    }

    throw new Error(
      `Dispatcher no encontrado en: ${dispatcherPath}. Script fallback tampoco existe: ${scriptPath}`,
    );
  }

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
   * Verifica la configuración de basePath y outputPath
   * Retorna información detallada sobre el estado de las rutas
   */
  verifyPathsConfiguration(): any {
    const settings = this.settingsService.getSettings();
    const basePath = settings.basePath;
    const outputPath = settings.outputPath;

    const result: any = {
      basePath: {
        configured: !!basePath && basePath.trim() !== '',
        path: basePath || 'Not configured',
        exists: false,
        readable: false,
        writable: false,
        pdfFiles: [],
        error: null,
      },
      outputPath: {
        configured: !!outputPath && outputPath.trim() !== '',
        path: outputPath || 'Not configured',
        exists: false,
        readable: false,
        writable: false,
        error: null,
      },
    };

    // Verificar basePath
    if (result.basePath.configured) {
      try {
        result.basePath.exists = fs.existsSync(basePath);

        if (result.basePath.exists) {
          // Verificar permisos de lectura
          try {
            fs.accessSync(basePath, fs.constants.R_OK);
            result.basePath.readable = true;

            // Listar archivos PDF
            const files = fs.readdirSync(basePath);
            result.basePath.pdfFiles = files.filter((file) =>
              file.toLowerCase().endsWith('.pdf'),
            );
          } catch (error) {
            result.basePath.error = `Cannot read directory: ${error.message}`;
          }

          // Verificar permisos de escritura
          try {
            fs.accessSync(basePath, fs.constants.W_OK);
            result.basePath.writable = true;
          } catch (error) {
            // No es crítico si no tiene permisos de escritura
          }
        } else {
          result.basePath.error = 'Directory does not exist';
        }
      } catch (error) {
        result.basePath.error = error.message;
      }
    } else {
      result.basePath.error = 'BasePath is not configured in Settings';
    }

    // Verificar outputPath
    if (result.outputPath.configured) {
      try {
        result.outputPath.exists = fs.existsSync(outputPath);

        if (result.outputPath.exists) {
          // Verificar permisos de lectura
          try {
            fs.accessSync(outputPath, fs.constants.R_OK);
            result.outputPath.readable = true;
          } catch (error) {
            result.outputPath.error = `Cannot read directory: ${error.message}`;
          }

          // Verificar permisos de escritura
          try {
            fs.accessSync(outputPath, fs.constants.W_OK);
            result.outputPath.writable = true;
          } catch (error) {
            result.outputPath.error = `Cannot write to directory: ${error.message}`;
          }
        } else {
          result.outputPath.error = 'Directory does not exist';
        }
      } catch (error) {
        result.outputPath.error = error.message;
      }
    } else {
      result.outputPath.error = 'OutputPath is not configured in Settings';
    }

    // Resumen general
    result.summary = {
      allConfigured: result.basePath.configured && result.outputPath.configured,
      allExist: result.basePath.exists && result.outputPath.exists,
      allReadable: result.basePath.readable && result.outputPath.readable,
      allWritable: result.basePath.writable && result.outputPath.writable,
      ready:
        result.basePath.configured &&
        result.basePath.exists &&
        result.basePath.readable &&
        result.outputPath.configured &&
        result.outputPath.exists &&
        result.outputPath.writable,
      pdfFilesAvailable: result.basePath.pdfFiles.length > 0,
    };

    return result;
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

  // ==========================================
  // 📚 MÉTODOS DE PRUEBA DE BIBLIOTECAS
  // ==========================================

  /**
   * Verifica que todas las bibliotecas estén instaladas
   */
  async testAllLibraries(): Promise<any> {
    return this.executeDispatcher('test_all_libraries', []);
  }

  /**
   * Prueba NumPy
   */
  async testNumpy(): Promise<any> {
    return this.executeDispatcher('test_numpy_pandas', []);
  }

  /**
   * Prueba Pandas
   */
  async testPandas(): Promise<any> {
    return this.executeDispatcher('test_numpy_pandas', ['pandas']);
  }

  /**
   * Prueba NumPy y Pandas combinados
   */
  async testNumpyPandasCombined(): Promise<any> {
    return this.executeDispatcher('test_numpy_pandas', ['combinado']);
  }

  /**
   * Crea un PDF de prueba con ReportLab
   */
  async testReportlab(outputPath: string): Promise<any> {
    const fullPath = this.buildOutputPath(outputPath);
    return this.executeDispatcher('test_reportlab', [fullPath]);
  }

  /**
   * Crea un gráfico con Matplotlib
   * @param tipo - Tipo de gráfico: 'lineas', 'barras', 'dispersion', 'pastel'
   * @param outputPath - Ruta donde guardar el gráfico
   */
  async testMatplotlib(tipo: string, outputPath: string): Promise<any> {
    const fullPath = this.buildOutputPath(outputPath);
    return this.executeDispatcher('test_matplotlib', [tipo, fullPath]);
  }

  /**
   * Crea una imagen con OpenCV
   */
  async testOpenCV(outputPath: string): Promise<any> {
    const fullPath = this.buildOutputPath(outputPath);
    return this.executeDispatcher('test_opencv', [fullPath]);
  }

  /**
   * Crea una imagen con Pillow
   */
  async testPillow(outputPath: string): Promise<any> {
    const fullPath = this.buildOutputPath(outputPath);
    return this.executeDispatcher('test_pillow', [fullPath]);
  }

  /**
   * Prueba funciones estadísticas de SciPy
   */
  async testScipy(): Promise<any> {
    return this.executeDispatcher('test_scipy', []);
  }

  /**
   * Lee información de un PDF con PyPDF
   */
  async testPyPDF(pdfPath?: string): Promise<any> {
    let fullPath = pdfPath;

    // Si no se proporciona un path, buscar un PDF en basePath
    if (!fullPath) {
      const settings = this.settingsService.getSettings();
      const basePath = settings.basePath;

      this.logger.log(`📁 Checking basePath: ${basePath}`);

      // Validar que basePath esté configurado
      if (!basePath || basePath.trim() === '') {
        const error =
          'BasePath is not configured. Please configure it in Settings before running PDF tests.';
        this.logger.error(`❌ ${error}`);
        throw new Error(error);
      }

      // Validar que basePath exista
      if (!fs.existsSync(basePath)) {
        const error = `BasePath does not exist: ${basePath}. Please create the directory or update the path in Settings.`;
        this.logger.error(`❌ ${error}`);
        throw new Error(error);
      }

      // Buscar el primer archivo PDF en basePath
      const files = fs.readdirSync(basePath);
      this.logger.log(`📂 Files in basePath: ${files.join(', ')}`);

      const pdfFile = files.find((file) => file.toLowerCase().endsWith('.pdf'));

      if (pdfFile) {
        fullPath = path.join(basePath, pdfFile);
        this.logger.log(`✅ Using PDF from basePath: ${fullPath}`);
      } else {
        const error = `No PDF files found in basePath: ${basePath}. Please add at least one PDF file to this directory.`;
        this.logger.error(`❌ ${error}`);
        throw new Error(error);
      }
    } else if (!path.isAbsolute(fullPath)) {
      // Si es una ruta relativa, construir desde el directorio del proyecto
      fullPath = path.resolve(__dirname, '../../../', fullPath);
      this.logger.log(`📄 Resolved PDF path: ${fullPath}`);
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(fullPath)) {
      const error = `PDF file not found: ${fullPath}`;
      this.logger.error(`❌ ${error}`);
      throw new Error(error);
    }

    return this.executeDispatcher('test_pypdf', [fullPath]);
  }

  /**
   * Analiza un PDF con PyMuPDF
   */
  async testPyMuPDF(pdfPath?: string): Promise<any> {
    let fullPath = pdfPath;

    // Si no se proporciona un path, buscar un PDF en basePath
    if (!fullPath) {
      const settings = this.settingsService.getSettings();
      const basePath = settings.basePath;

      this.logger.log(`📁 Checking basePath: ${basePath}`);

      // Validar que basePath esté configurado
      if (!basePath || basePath.trim() === '') {
        const error =
          'BasePath is not configured. Please configure it in Settings before running PDF tests.';
        this.logger.error(`❌ ${error}`);
        throw new Error(error);
      }

      // Validar que basePath exista
      if (!fs.existsSync(basePath)) {
        const error = `BasePath does not exist: ${basePath}. Please create the directory or update the path in Settings.`;
        this.logger.error(`❌ ${error}`);
        throw new Error(error);
      }

      // Buscar el primer archivo PDF en basePath
      const files = fs.readdirSync(basePath);
      this.logger.log(`� Files in basePath: ${files.join(', ')}`);

      const pdfFile = files.find((file) => file.toLowerCase().endsWith('.pdf'));

      if (pdfFile) {
        fullPath = path.join(basePath, pdfFile);
        this.logger.log(`✅ Using PDF from basePath: ${fullPath}`);
      } else {
        const error = `No PDF files found in basePath: ${basePath}. Please add at least one PDF file to this directory.`;
        this.logger.error(`❌ ${error}`);
        throw new Error(error);
      }
    } else if (!path.isAbsolute(fullPath)) {
      // Si es una ruta relativa, construir desde el directorio del proyecto
      fullPath = path.resolve(__dirname, '../../../', fullPath);
      this.logger.log(`📄 Resolved PDF path: ${fullPath}`);
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(fullPath)) {
      throw new Error(`PDF file not found: ${fullPath}`);
    }

    return this.executeDispatcher('test_pymupdf', [fullPath]);
  }

  /**
   * Ejecuta la prueba rápida de todas las bibliotecas
   */
  async quickTest(): Promise<any> {
    return this.executeDispatcher('quick_test', []);
  }
}
