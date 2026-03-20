import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DatabaseSettings } from '../database/entities/database.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  getSettings(): DatabaseSettings {
    return this.databaseService.getSettings();
  }

  getDefaultSettings(): DatabaseSettings {
    return this.databaseService.getDefaultSettings();
  }

  updateSettings(updates: Partial<DatabaseSettings>): DatabaseSettings {
    return this.databaseService.updateSettings(updates);
  }

  resetToDefault(): DatabaseSettings {
    return this.databaseService.resetSettingsToDefault();
  }

  /**
   * Valida si un path existe y tiene los permisos necesarios
   */
  validatePath(
    pathToValidate: string,
    type: 'read' | 'write' | 'both',
  ): {
    valid: boolean;
    exists: boolean;
    canRead: boolean;
    canWrite: boolean;
    error?: string;
  } {
    this.logger.log(`Validating path: ${pathToValidate}`);
    this.logger.log(`Validation type: ${type}`);

    // 1. Prevención de Path Traversal (rechazar explícitamente '..')
    if (pathToValidate.includes('..')) {
      this.logger.warn(`Validation failed: Path traversal attempt detected`);
      return {
        valid: false,
        exists: false,
        canRead: false,
        canWrite: false,
        error: 'Path traversal (..) is not allowed',
      };
    }

    // 2. Normalizar la ruta para resolver referencias y uniformar separadores
    const normalizedPath = path.resolve(pathToValidate);
    this.logger.log(`Normalized path: ${normalizedPath}`);

    // 3. Restricción de acceso a rutas del sistema operativo
    const lowerPath = normalizedPath.toLowerCase();
    const isWindows = process.platform === 'win32';

    const restrictedPaths = isWindows
      ? [
          'c:\\windows',
          'c:\\program files',
          'c:\\program files (x86)',
          'c:\\programdata',
        ]
      : ['/etc', '/var', '/usr', '/root', '/bin', '/sbin', '/sys', '/dev'];

    const isRestricted = restrictedPaths.some((rp) => lowerPath.startsWith(rp));

    if (isRestricted) {
      this.logger.warn(`Validation failed: System path access restricted`);
      return {
        valid: false,
        exists: false,
        canRead: false,
        canWrite: false,
        error:
          'Access to system directories is not allowed for security reasons',
      };
    }

    try {
      // Verificar si el path existe usando la ruta normalizada
      const exists = fs.existsSync(normalizedPath);
      this.logger.log(`Path exists: ${exists}`);

      if (!exists) {
        this.logger.warn(`Validation failed: Path does not exist`);
        return {
          valid: false,
          exists: false,
          canRead: false,
          canWrite: false,
          error: 'Path does not exist',
        };
      }

      // Verificar si es un directorio
      const stats = fs.statSync(normalizedPath);
      const isDirectory = stats.isDirectory();
      this.logger.log(`Is directory: ${isDirectory}`);

      if (!isDirectory) {
        this.logger.warn(`Validation failed: Path is not a directory`);
        return {
          valid: false,
          exists: true,
          canRead: false,
          canWrite: false,
          error: 'Path is not a directory',
        };
      }

      // Verificar permisos de lectura
      let canRead = false;
      try {
        fs.accessSync(normalizedPath, fs.constants.R_OK);
        canRead = true;
        this.logger.log(`Read permission: YES`);
      } catch (error) {
        canRead = false;
        this.logger.warn(`Read permission: NO`);
      }

      // Verificar permisos de escritura
      let canWrite = false;
      try {
        fs.accessSync(normalizedPath, fs.constants.W_OK);
        canWrite = true;
        this.logger.log(`Write permission: YES`);
      } catch (error) {
        canWrite = false;
        this.logger.warn(`Write permission: NO`);
      }

      // Validar según el tipo requerido
      let valid = false;
      let errorMessage: string | undefined;

      if (type === 'read' && !canRead) {
        errorMessage = 'No read permission for this path';
        this.logger.warn(`Validation failed: ${errorMessage}`);
      } else if (type === 'write' && !canWrite) {
        errorMessage = 'No write permission for this path';
        this.logger.warn(`Validation failed: ${errorMessage}`);
      } else if (type === 'both' && (!canRead || !canWrite)) {
        if (!canRead && !canWrite) {
          errorMessage = 'No read or write permission for this path';
        } else if (!canRead) {
          errorMessage = 'No read permission for this path';
        } else {
          errorMessage = 'No write permission for this path';
        }
        this.logger.warn(`Validation failed: ${errorMessage}`);
      } else {
        valid = true;
        this.logger.log(`Validation passed!`);
      }

      const result = {
        valid,
        exists: true,
        canRead,
        canWrite,
        error: errorMessage,
      };

      this.logger.log(`Validation result: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error(
        `Error during validation: ${error.message || error}`,
        error?.stack,
      );
      return {
        valid: false,
        exists: false,
        canRead: false,
        canWrite: false,
        error: error.message || 'Error validating path',
      };
    }
  }
}
