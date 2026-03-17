/**
 * Interfaz para los metadatos de un archivo PDF
 * Según el estándar: Style_Size_Number_Name.pdf
 */
export interface PDFMetadata {
  // Información básica del archivo
  FileName: string; // Nombre completo del archivo: "J5JC1A_M_MATT_00.pdf"
  RelativePath: string; // Ruta relativa desde el drag: "J1C68Q_BG/M.pdf" (antes FullPath)
  ShortPath: string; // Ruta sin InputRoot: "M.pdf" (antes RelativePath)
  InputRoot: string; // Ruta raíz seleccionada por el usuario: "J1C68Q_BG"
  SystemPath?: string; // Ruta absoluta del sistema (opcional): "C:\Users\...\file.pdf"

  // Metadatos extraídos del nombre
  Style: string; // Estilo extraído: "J5JC1A"
  Size: string; // Tamaño extraído: "M", "S", "XL", "XS"

  // Validación
  Valid: boolean; // true si cumple el patrón estándar, false si no
  ValidationError?: string; // Mensaje de error si no es válido

  // Información adicional
  FileSize: number; // Tamaño del archivo en bytes
  FileType: string; // Tipo MIME del archivo
}

/**
 * Resultado de la validación del nombre de un PDF
 */
export interface PDFNameValidation {
  isValid: boolean;
  style?: string;
  size?: string;
  error?: string;
}

/**
 * Contenedor temporal para almacenar todos los PDFs procesados
 */
export interface PDFContainer {
  files: PDFMetadata[];
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  excludedFiles: ExcludedFile[];
  processedAt: Date;
}

/**
 * Archivos excluidos (no-PDF)
 */
export interface ExcludedFile {
  fileName: string;
  relativePath: string; // Ruta relativa desde el drag (antes fullPath)
  reason: string;
  excludedAt: Date;
}
