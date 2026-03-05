import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name);

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
   * @param scriptName - Nombre del archivo Python (ej: 'mi_script.py')
   * @param args - Array de argumentos para pasar al script
   * @returns Promise con el resultado parseado como JSON
   */
  async executeScript(scriptName: string, args: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonExe = this.getPythonExecutable();
      const scriptPath = path.join(this.scriptsPath, scriptName);

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
}
