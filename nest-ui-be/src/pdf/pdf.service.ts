import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

const execAsync = promisify(exec);

@Injectable()
export class PdfService {
  private readonly pythonScriptPath: string;

  constructor() {
    // Ruta al script Python (corregida para apuntar a nest-files-py)
    this.pythonScriptPath = path.resolve(
      __dirname,
      '../../../nest-files-py/generate_pdf.py',
    );
    console.log('Python script path:', this.pythonScriptPath);
  }

  async verifyFolder(folderPath: string) {
    try {
      const scriptPath = path.resolve(
        __dirname,
        '../../../nest-files-py/verify_folder.py',
      );

      const command = `py "${scriptPath}" "${folderPath}"`;
      console.log('Verifying folder:', folderPath);

      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000,
      });

      if (stderr) {
        console.error('Python stderr:', stderr);
      }

      const result = JSON.parse(stdout);
      return result;
    } catch (error) {
      console.error('Error verifying folder:', error);
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
      console.log('Temp file created:', tempFilePath);

      // Ejecutar script Python pasando la ruta del archivo temporal
      const command = `py "${this.pythonScriptPath}" "${tempFilePath}"`;
      console.log('Executing Python command:', command);

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 segundos timeout
      });

      if (stderr) {
        console.error('Python stderr:', stderr);
      }

      console.log('Python stdout:', stdout);

      // Parsear resultado
      const result = JSON.parse(stdout.trim());

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error('Error executing Python script:', error);
      throw new Error(`Failed to generate PDFs: ${error.message}`);
    } finally {
      // Limpiar archivo temporal
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
          console.log('Temp file deleted:', tempFilePath);
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
      }
    }
  }

  async testPythonConnection() {
    try {
      const { stdout } = await execAsync('py --version');
      return { version: stdout.trim() };
    } catch (error) {
      throw new Error('Python not found or not accessible');
    }
  }
}
