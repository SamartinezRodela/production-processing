import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface GeneratePdfDto {
  type: 'single' | 'multiple';
  names: string[];
  facility: string;
  processType: string;
  files: Array<{
    name: string;
    size: string;
    type: string;
  }>;
}

@Controller('pdf')
@UseGuards(JwtAuthGuard) // ✅ Proteger todas las rutas de PDF
export class PdfController {
  private readonly logger = new Logger(PdfController.name);

  constructor(private readonly pdfService: PdfService) {}

  @Post('generate')
  async generatePDFs(@Body() data: GeneratePdfDto) {
    try {
      this.logger.log(
        `Received PDF generation request for: ${data.names?.join(', ') || 'no names'}`,
      );

      if (!data.names || data.names.length === 0) {
        throw new HttpException(
          'No PDF names provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Permitir generar PDFs sin archivos seleccionados (opcional)

      const result = await this.pdfService.generatePDFs(data);

      return {
        success: true,
        message: 'PDFs generated successfully',
        ...result,
      };
    } catch (error) {
      this.logger.error(
        `Error generating PDFs: ${error.message || error}`,
        error?.stack,
      );
      throw new HttpException(
        error.message || 'Failed to generate PDFs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-folder')
  async verifyFolder(@Body() data: { path: string }) {
    try {
      if (!data.path) {
        throw new HttpException('No path provided', HttpStatus.BAD_REQUEST);
      }

      const result = await this.pdfService.verifyFolder(data.path);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to verify folder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test')
  async testPython() {
    try {
      const result = await this.pdfService.testPythonConnection();
      return {
        success: true,
        message: 'Python connection successful',
        result,
      };
    } catch (error) {
      throw new HttpException(
        'Python connection failed: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
