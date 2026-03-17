import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PythonService } from './python.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('python')
@UseGuards(JwtAuthGuard) // ✅ Proteger todas las rutas de Python
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

  /**
   * Verifica la configuración de rutas (basePath y outputPath)
   * GET /python/verify-paths
   */
  @Get('verify-paths')
  async verifyPaths() {
    try {
      return await this.pythonService.verifyPathsConfiguration();
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error verificando configuración de rutas',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  @Post('guardar-pdf-relativo')
  async guardarPdfRelativo(
    @Body()
    body: {
      output_path: string;
      relative_path: string;
      input_path: string;
    },
  ) {
    try {
      return await this.pythonService.guardarPdfRelativo(body);
    } catch (error: any) {
      throw new HttpException(
        { message: 'Error al guarda PDF', error: error.message || error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('save-metadata')
  async saveMetada(@Body() body: { data: any }) {
    try {
      return await this.pythonService.saveMetadata(body.data);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error al guardar metadatos',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  // ==========================================
  // 📚 ENDPOINTS DE PRUEBA DE BIBLIOTECAS
  // ==========================================

  /**
   * Prueba rápida de todas las bibliotecas
   * GET /python/test/quick
   */
  @Get('test/quick')
  async quickTest() {
    try {
      return await this.pythonService.quickTest();
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error en prueba rápida',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verifica que todas las bibliotecas estén instaladas
   * GET /python/test/libraries
   */
  @Get('test/libraries')
  async testAllLibraries() {
    try {
      return await this.pythonService.testAllLibraries();
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error verificando bibliotecas',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba NumPy
   * GET /python/test/numpy
   */
  @Get('test/numpy')
  async testNumpy() {
    try {
      return await this.pythonService.testNumpy();
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando NumPy',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba Pandas
   * GET /python/test/pandas
   */
  @Get('test/pandas')
  async testPandas() {
    try {
      return await this.pythonService.testPandas();
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando Pandas',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba NumPy y Pandas combinados
   * GET /python/test/numpy-pandas
   */
  @Get('test/numpy-pandas')
  async testNumpyPandas() {
    try {
      return await this.pythonService.testNumpyPandasCombined();
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando NumPy y Pandas',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba ReportLab (crear PDF)
   * POST /python/test/reportlab
   * Body: { outputPath: string }
   */
  @Post('test/reportlab')
  async testReportlab(@Body() body: { outputPath: string }) {
    try {
      const outputPath = body.outputPath || 'test_reportlab.pdf';
      return await this.pythonService.testReportlab(outputPath);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando ReportLab',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba Matplotlib (crear gráfico)
   * POST /python/test/matplotlib
   * Body: { tipo: 'lineas' | 'barras' | 'dispersion' | 'pastel', outputPath: string }
   */
  @Post('test/matplotlib')
  async testMatplotlib(@Body() body: { tipo: string; outputPath: string }) {
    try {
      const tipo = body.tipo || 'lineas';
      const outputPath = body.outputPath || `test_matplotlib_${tipo}.png`;
      return await this.pythonService.testMatplotlib(tipo, outputPath);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando Matplotlib',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba OpenCV (crear imagen)
   * POST /python/test/opencv
   * Body: { outputPath: string }
   */
  @Post('test/opencv')
  async testOpenCV(@Body() body: { outputPath: string }) {
    try {
      const outputPath = body.outputPath || 'test_opencv.png';
      return await this.pythonService.testOpenCV(outputPath);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando OpenCV',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba Pillow (crear imagen)
   * POST /python/test/pillow
   * Body: { outputPath: string }
   */
  @Post('test/pillow')
  async testPillow(@Body() body: { outputPath: string }) {
    try {
      const outputPath = body.outputPath || 'test_pillow.png';
      return await this.pythonService.testPillow(outputPath);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando Pillow',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba SciPy
   * GET /python/test/scipy
   */
  @Get('test/scipy')
  async testScipy() {
    try {
      return await this.pythonService.testScipy();
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando SciPy',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba PyPDF (leer PDF)
   * POST /python/test/pypdf
   * Body: { pdfPath?: string } (opcional - si no se proporciona, busca en basePath)
   */
  @Post('test/pypdf')
  async testPyPDF(@Body() body: { pdfPath?: string }) {
    try {
      return await this.pythonService.testPyPDF(body.pdfPath);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando PyPDF',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prueba PyMuPDF (analizar PDF)
   * POST /python/test/pymupdf
   * Body: { pdfPath?: string } (opcional - si no se proporciona, busca en basePath)
   */
  @Post('test/pymupdf')
  async testPyMuPDF(@Body() body: { pdfPath?: string }) {
    try {
      return await this.pythonService.testPyMuPDF(body.pdfPath);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error probando PyMuPDF',
          error: error.message || error,
          details: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
