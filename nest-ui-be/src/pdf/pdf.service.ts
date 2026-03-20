import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { PythonService } from 'src/python/python.service';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly pythonScriptPath: string;

  constructor(private readonly pythonService: PythonService) {}

  async verifyFolder(folderPath: string) {
    try {
      this.logger.log(`Verifying folder: ${folderPath}`);

      const result = await this.pythonService.executeDispatcher(
        'verify_folder',
        [folderPath],
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error verifying folder: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to verify folder: ${error.message}`);
    }
  }

  async generatePDFs(data: any) {
    const { type, names, facility, processType, files } = data;
    let tempFilePath: string | null = null;

    try {
      // Crear archivo temporal con los datos JSON
      tempFilePath = path.join(os.tmpdir(), `pdf-data-${Date.now()}.json`);
      const jsonData = JSON.stringify({
        type,
        names,
        facility,
        processType,
        files: files || [],
      });

      await fs.writeFile(tempFilePath, jsonData, 'utf-8');
      this.logger.debug(`Temp file created: ${tempFilePath}`);

      const result = await this.pythonService.executeDispatcher(
        'generate_pdf',
        [tempFilePath],
      );

      this.logger.debug('Python execution completed successfully');

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error executing Python script: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to generate PDFs: ${error.message}`);
    } finally {
      // Limpiar archivo temporal
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
          this.logger.debug(`Temp file deleted: ${tempFilePath}`);
        } catch (err) {
          this.logger.warn(`Error deleting temp file: ${err.message}`);
        }
      }
    }
  }

  async testPythonConnection() {
    try {
      return { version: 'Managed internally by python service' };
    } catch (error) {
      throw new Error('Python not found or not accessible');
    }
  }
}
