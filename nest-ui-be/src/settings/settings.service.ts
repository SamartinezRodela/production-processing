import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DatabaseSettings } from '../database/entities/database.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SettingsService {
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
    console.log('🔍 Validating path:', pathToValidate);
    console.log('📋 Validation type:', type);

    try {
      // Verificar si el path existe
      const exists = fs.existsSync(pathToValidate);
      console.log('📁 Path exists:', exists);

      if (!exists) {
        console.log('❌ Validation failed: Path does not exist');
        return {
          valid: false,
          exists: false,
          canRead: false,
          canWrite: false,
          error: 'Path does not exist',
        };
      }

      // Verificar si es un directorio
      const stats = fs.statSync(pathToValidate);
      const isDirectory = stats.isDirectory();
      console.log('📂 Is directory:', isDirectory);

      if (!isDirectory) {
        console.log('❌ Validation failed: Path is not a directory');
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
        fs.accessSync(pathToValidate, fs.constants.R_OK);
        canRead = true;
        console.log('✅ Read permission: YES');
      } catch (error) {
        canRead = false;
        console.log('❌ Read permission: NO');
      }

      // Verificar permisos de escritura
      let canWrite = false;
      try {
        fs.accessSync(pathToValidate, fs.constants.W_OK);
        canWrite = true;
        console.log('✅ Write permission: YES');
      } catch (error) {
        canWrite = false;
        console.log('❌ Write permission: NO');
      }

      // Validar según el tipo requerido
      let valid = false;
      let errorMessage: string | undefined;

      if (type === 'read' && !canRead) {
        errorMessage = 'No read permission for this path';
        console.log('❌ Validation failed:', errorMessage);
      } else if (type === 'write' && !canWrite) {
        errorMessage = 'No write permission for this path';
        console.log('❌ Validation failed:', errorMessage);
      } else if (type === 'both' && (!canRead || !canWrite)) {
        if (!canRead && !canWrite) {
          errorMessage = 'No read or write permission for this path';
        } else if (!canRead) {
          errorMessage = 'No read permission for this path';
        } else {
          errorMessage = 'No write permission for this path';
        }
        console.log('❌ Validation failed:', errorMessage);
      } else {
        valid = true;
        console.log('✅ Validation passed!');
      }

      const result = {
        valid,
        exists: true,
        canRead,
        canWrite,
        error: errorMessage,
      };

      console.log('📊 Validation result:', result);
      return result;
    } catch (error: any) {
      console.error('💥 Error during validation:', error);
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
