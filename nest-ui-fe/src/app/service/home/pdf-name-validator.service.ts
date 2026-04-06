import { Injectable } from '@angular/core';
import { PDFNameValidation } from '@app/models/pdf-metadata.types';

@Injectable({
  providedIn: 'root',
})
export class PdfNameValidatorService {
  // Patrón estándar: Style_Size_Number_Name.pdf
  // Ejemplo: J5JC1A_M_00_MATT.pdf o A1B2C3_M_127_.pdf
  // Style: 6 caracteres alfanuméricos (ej: J5JC1A, A1B2C3)
  // Size: XS, S, M, L, XL, XXL
  // Number: Opcional, solo dígitos numéricos (ej: 00, 01, 127, o vacío)
  // Name: Opcional, texto alfanumérico sin dígitos al inicio (ej: MATT, HUGO, o vacío)
  // IMPORTANTE: Number debe ser SOLO dígitos, Name debe ser SOLO letras/guiones bajos
  private readonly STANDARD_PATTERN =
    /^([A-Z0-9]{4,10})_(5XL|5X|4XL|4X|3XL|3X|2XL|2X|XXL|XL|XS|M|L|S)_(\d*)_([A-Z_]*)\.pdf$/i;

  // Patrón relajado para extraer Style y Size incluso si el archivo es inválido
  // Esto permite mostrar Style y Size en la tabla aunque el orden sea incorrecto
  // Acepta cualquier contenido después de Size (con o sin guiones bajos)
  private readonly RELAXED_PATTERN =
    /^([A-Z0-9]{4,10})_(5XL|5X|4XL|4X|3XL|3X|2XL|2X|XXL|XL|XS|M|L|S)_.*\.pdf$/i;

  //Tamaños Validos
  private readonly VALID_SIZES = [
    'XS',
    'S',
    'M',
    'L',
    'XL',
    'XXL',
    '2XL',
    '2X',
    '3XL',
    '3X',
    '4XL',
    '4X',
    '5XL',
    '5X',
  ];

  /**
   * Valida el nombre de un archivo PDF contra el patrón estándar
   * @param fileName Nombre del archivo PDF
   * @returns Resultado de la validación con style y size extraídos
   */
  validatePDFName(fileName: string): PDFNameValidation {
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return {
        isValid: false,
        error: 'File is not a PDF',
      };
    }

    // Intentar hacer match con el patrón estándar (estricto)
    const match = fileName.match(this.STANDARD_PATTERN);

    if (match) {
      // Archivo válido con patrón estricto
      const [, style, size] = match;

      // Validar que el size sea válido
      if (!this.VALID_SIZES.includes(size.toUpperCase())) {
        return {
          isValid: false,
          style: style.toUpperCase(),
          size: size.toUpperCase(),
          error: `Invalid size value "${size}". Valid sizes: ${this.VALID_SIZES.join(', ')}`,
        };
      }

      return {
        isValid: true,
        style: style.toUpperCase(),
        size: size.toUpperCase(),
      };
    }

    // Si el patrón estricto falla, intentar extraer Style y Size con patrón relajado
    const relaxedMatch = fileName.match(this.RELAXED_PATTERN);

    if (relaxedMatch) {
      const [, style, size] = relaxedMatch;

      // Validar que el size sea válido
      if (!this.VALID_SIZES.includes(size.toUpperCase())) {
        return {
          isValid: false,
          style: style.toUpperCase(),
          size: size.toUpperCase(),
          error: `Invalid size value "${size}". Valid sizes: ${this.VALID_SIZES.join(', ')}`,
        };
      }

      // Archivo inválido pero con Style y Size extraíbles
      return {
        isValid: false,
        style: style.toUpperCase(),
        size: size.toUpperCase(),
        error:
          'File name does not match standard pattern (Expected: Style_Size_Number_Name.pdf where Number is digits only and Name is letters only)',
      };
    }

    // No se pudo extraer ni Style ni Size
    return {
      isValid: false,
      error:
        'File name does not match standard pattern (Expected: Style_Size_Number_Name.pdf, e.g., J5JC1A_M_00_MATT.pdf or A1B2C3_M__.pdf)',
    };
  }

  /**
   * Extrae el style del nombre del archivo
   * @param fileName Nombre del archivo PDF
   * @returns Style extraído o 'N/A' si no se encuentra
   */
  extractStyle(fileName: string): string {
    const validation = this.validatePDFName(fileName);
    return validation.style || 'N/A';
  }

  /**
   * Extrae el size del nombre del archivo
   * @param fileName Nombre del archivo PDF
   * @returns Size extraído o 'N/A' si no se encuentra
   */
  extractSize(fileName: string): string {
    const validation = this.validatePDFName(fileName);
    return validation.size || 'N/A';
  }

  /**
   * Verifica si un archivo cumple con el patrón estándar
   * @param fileName Nombre del archivo
   * @returns true si es válido, false si no
   */
  isValidPDFName(fileName: string): boolean {
    return this.validatePDFName(fileName).isValid;
  }
}
