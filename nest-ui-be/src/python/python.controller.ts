import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PythonService } from './python.service';

@Controller('python')
export class PythonController {
  constructor(private readonly pythonService: PythonService) {}

  // ==========================================
  // AGREGA TUS ENDPOINTS AQUÍ ⬇️
  // ==========================================

  // Ejemplo GET:
  // @Get('tu-endpoint')
  // async tuFuncion(@Query('param1') param1: string) {
  //   return this.pythonService.tuFuncion(param1);
  // }

  // Ejemplo POST:
  // @Post('tu-endpoint')
  // async tuFuncion(@Body() body: { param1: string; param2: number }) {
  //   return this.pythonService.tuFuncion(body.param1, body.param2);
  // }

  @Get('saludar')
  async saludar(@Query('nombre') nombre: string) {
    if (!nombre) {
      throw new HttpException('El nombre es requerido', HttpStatus.BAD_REQUEST);
    }
    return this.pythonService.saludar(nombre);
  }

  @Get('debug-paths')
  async debugPaths() {
    return this.pythonService.getDebugInfo();
  }

  @Get('verify-integrity')
  async verifyIntegrity() {
    return this.pythonService.verifyAllFiles();
  }

  @Get('test-python')
  async testPython() {
    try {
      const result = await this.pythonService.executeScript(
        'test_imports.py',
        [],
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error,
      };
    }
  }

  @Post('generar-pdf')
  async generarPDF(
    @Body()
    body: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
    },
  ) {
    if (!body.titulo || !body.contenido) {
      throw new HttpException(
        'El titulo y el contenido son requeridos',
        HttpStatus.BAD_REQUEST,
      );
    }
    const datos = {
      titulo: body.titulo,
      contenido: body.contenido,
      autor: body.autor || 'Anonimo',
      nombre_archivo: body.nombre_archivo || 'documento.pdf',
    };
    return this.pythonService.generarPDF(datos);
  }

  @Post('generar-path-pdf')
  async generarPathPDF(
    @Body()
    body: {
      titulo: string;
      contenido: string;
      autor: string;
      nombre_archivo: string;
      ruta_salida: string;
    },
  ) {
    try {
      if (!body.titulo || !body.contenido) {
        throw new HttpException(
          'El titulo y el contenido son requeridos',
          HttpStatus.BAD_REQUEST,
        );
      }
      const datos = {
        titulo: body.titulo,
        contenido: body.contenido,
        autor: body.autor || 'Anonimo',
        nombre_archivo: body.nombre_archivo || 'documento.pdf',
        ruta_salida: body.ruta_salida || './documents',
      };
      const resultado = await this.pythonService.generarPathPDF(datos);
      return resultado;
    } catch (error) {
      console.error('Error en generarPathPDF controller:', error);
      throw new HttpException(
        {
          message: 'Error al generar PDF',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Endpoint unificado para ejecutar archivos .py o .exe
   * Detecta automáticamente el tipo de archivo por su extensión
   */
  @Post('execute-file')
  async executeFile(@Body() body: { fileName: string; args?: string[] }) {
    try {
      if (!body.fileName) {
        throw new HttpException(
          'El nombre del archivo es requerido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar extensión
      const validExtensions = ['.py', '.exe'];
      const extension = body.fileName.substring(body.fileName.lastIndexOf('.'));

      if (!validExtensions.includes(extension.toLowerCase())) {
        throw new HttpException(
          `Extensión no válida. Solo se permiten: ${validExtensions.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const resultado = await this.pythonService.executeFile(
        body.fileName,
        body.args || [],
      );

      return {
        success: true,
        fileName: body.fileName,
        fileType: extension,
        result: resultado,
      };
    } catch (error) {
      console.error('Error en execute-file controller:', error);
      throw new HttpException(
        {
          message: 'Error al ejecutar archivo',
          fileName: body.fileName,
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Endpoint específico para ejecutar archivos .exe
   */
  @Post('execute-exe')
  async executeExe(@Body() body: { exeName: string; args?: string[] }) {
    try {
      if (!body.exeName) {
        throw new HttpException(
          'El nombre del ejecutable es requerido',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!body.exeName.toLowerCase().endsWith('.exe')) {
        throw new HttpException(
          'El archivo debe tener extensión .exe',
          HttpStatus.BAD_REQUEST,
        );
      }

      const resultado = await this.pythonService.executeExecutable(
        body.exeName,
        body.args || [],
      );

      return {
        success: true,
        exeName: body.exeName,
        result: resultado,
      };
    } catch (error) {
      console.error('Error en execute-exe controller:', error);
      throw new HttpException(
        {
          message: 'Error al ejecutar ejecutable',
          exeName: body.exeName,
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
