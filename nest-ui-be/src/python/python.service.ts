import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name);

  /**
   * 🔒 WHITELIST DE HASHES SHA-256
   * Estos hashes verifican la integridad de los archivos .pyc
   * Se cargan desde python-hashes.json generado durante el build
   */
  private HASHES_WHITELIST: Record<string, string> = {};

  constructor(private readonly settingsService: SettingsService) {
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
        this.logger.log(`✅ SEGURIDAD: Verificación de integridad ACTIVA`);
        this.logger.log(`   Hashes cargados desde: ${hashesPath}`);
        this.logger.log(
          `   Archivos protegidos: ${Object.keys(this.HASHES_WHITELIST).length}`,
        );
      } else {
        this.logger.warn(`⚠️  SEGURIDAD: python-hashes.json no encontrado`);
        this.logger.warn(`   Ruta buscada: ${hashesPath}`);
        this.logger.warn(
          `   Verificación de integridad DESHABILITADA (modo desarrollo)`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Error cargando hashes: ${error.message}`);
      this.logger.warn(`   Verificación de integridad DESHABILITADA`);
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

      this.logger.log(`📁 Checking outputPath: ${outputPath}`);

      // Validar que outputPath esté configurado
      if (!outputPath || outputPath.trim() === '') {
        const error =
          'OutputPath is not configured. Please configure it in Settings before running tests that generate files.';
        this.logger.error(`❌ ${error}`);
        throw new Error(error);
      }

      // Validar que outputPath exista
      if (!fs.existsSync(outputPath)) {
        const error = `OutputPath does not exist: ${outputPath}. Please create the directory or update the path in Settings.`;
        this.logger.error(`❌ ${error}`);
        throw new Error(error);
      }

      const fullPath = path.join(outputPath, fileName);
      this.logger.log(`✅ Output file will be saved to: ${fullPath}`);
      return fullPath;
    } catch (error) {
      this.logger.error(`❌ Error building output path: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔒 Verifica la integridad de un archivo .pyc
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
      this.logger.error(`❌ INTEGRIDAD: Archivo no encontrado: ${fileName}`);
      this.logger.error(`   Ruta esperada: ${filePath}`);
      return false;
    }

    // Si no hay whitelist cargada, permitir ejecución (modo desarrollo)
    if (Object.keys(this.HASHES_WHITELIST).length === 0) {
      this.logger.warn(
        `⚠️  MODO SIN VERIFICACIÓN: python-hashes.json no encontrado`,
      );
      this.logger.warn(
        `   Permitiendo ejecución sin verificación de integridad`,
      );
      return true;
    }

    // Verificar que tenemos el hash en la whitelist
    if (!this.HASHES_WHITELIST[fileName]) {
      this.logger.warn(
        `⚠️  INTEGRIDAD: Archivo no está en whitelist: ${fileName}`,
      );
      this.logger.warn(
        `   Permitiendo ejecución (archivo no listado en python-hashes.json)`,
      );
      return true; // Permitir archivos no listados
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
      const resourcesPath =
        process.env.RESOURCES_PATH || (process as any).resourcesPath;
      const isProduction = !!resourcesPath;

      // 🔒 PASO 1: Convertir .py a .pyc si es necesario (solo en producción)
      let finalScriptName = scriptName;
      if (isProduction && scriptName.endsWith('.py')) {
        finalScriptName = scriptName.replace('.py', '.pyc');
        this.logger.log(`🔄 Convirtiendo ${scriptName} → ${finalScriptName}`);
      }

      // 🔒 PASO 2: Verificar integridad del archivo (solo en producción)
      if (isProduction && !this.verifyFileIntegrity(finalScriptName)) {
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

  async guardarPdfRelativo(datos: {
    output_path: string;
    relative_path: string;
    input_path: string;
  }): Promise<any> {
    const datosJson = JSON.stringify(datos);
    return this.executeScript('guardar_pdf_path.py', [datosJson]);
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

  async saveMetadata(data: any): Promise<any> {
    try {
      // Determinar la ruta de la carpeta "data" en el backend
      const resourcesPath =
        process.env.RESOURCES_PATH || (process as any).resourcesPath;
      const dataDir = resourcesPath
        ? path.join(resourcesPath, 'backend', 'data') // Ruta en producción
        : path.resolve(__dirname, '../../data'); // Ruta en desarrollo (nest-ui-be/data)

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, 'tabla_metadatos.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

      return { success: true, message: 'Metadata saved successfully' };
    } catch (error) {
      this.logger.error(`Error saving metadata: ${error.message}`);
      throw error;
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
    return this.executeScript('test_all_libraries.py', []);
  }

  /**
   * Prueba NumPy
   */
  async testNumpy(): Promise<any> {
    return this.executeScript('test_numpy_pandas.py', []);
  }

  /**
   * Prueba Pandas
   */
  async testPandas(): Promise<any> {
    return this.executeScript('test_numpy_pandas.py', ['pandas']);
  }

  /**
   * Prueba NumPy y Pandas combinados
   */
  async testNumpyPandasCombined(): Promise<any> {
    return this.executeScript('test_numpy_pandas.py', ['combinado']);
  }

  /**
   * Crea un PDF de prueba con ReportLab
   */
  async testReportlab(outputPath: string): Promise<any> {
    const fullPath = this.buildOutputPath(outputPath);
    return this.executeScript('test_reportlab.py', [fullPath]);
  }

  /**
   * Crea un gráfico con Matplotlib
   * @param tipo - Tipo de gráfico: 'lineas', 'barras', 'dispersion', 'pastel'
   * @param outputPath - Ruta donde guardar el gráfico
   */
  async testMatplotlib(tipo: string, outputPath: string): Promise<any> {
    const fullPath = this.buildOutputPath(outputPath);
    return this.executeScript('test_matplotlib.py', [tipo, fullPath]);
  }

  /**
   * Crea una imagen con OpenCV
   */
  async testOpenCV(outputPath: string): Promise<any> {
    const fullPath = this.buildOutputPath(outputPath);
    return this.executeScript('test_opencv.py', [fullPath]);
  }

  /**
   * Crea una imagen con Pillow
   */
  async testPillow(outputPath: string): Promise<any> {
    const fullPath = this.buildOutputPath(outputPath);
    return this.executeScript('test_pillow.py', [fullPath]);
  }

  /**
   * Prueba funciones estadísticas de SciPy
   */
  async testScipy(): Promise<any> {
    return this.executeScript('test_scipy.py', []);
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

    return this.executeScript('test_pypdf.py', [fullPath]);
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

    return this.executeScript('test_pymupdf.py', [fullPath]);
  }

  /**
   * Ejecuta la prueba rápida de todas las bibliotecas
   */
  async quickTest(): Promise<any> {
    return this.executeScript('quick_test.py', []);
  }
}
