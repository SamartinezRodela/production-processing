// nest-ui-fe/src/app/service/pdf-generation.service.ts
import { Injectable, signal } from '@angular/core';
import { ElectronService } from '@services/electron.service';
import { NotificationService } from '@services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class PdfGenerationService {
  isGeneratingPDF = signal(false);
  pdfProgress = signal(0);
  isPDFModalOpen = signal(false);
  pdfGenerationType = signal<'single' | 'multiple'>('single');
  singlePDFName = signal('');
  multiplePDFNames = signal<string[]>([]);

  constructor(
    private electronService: ElectronService,
    private notificationService: NotificationService,
  ) {}

  openModal(): void {
    this.isPDFModalOpen.set(true);
    this.pdfGenerationType.set('single');
    this.singlePDFName.set('');
    this.multiplePDFNames.set([]);
  }

  closeModal(): void {
    this.isPDFModalOpen.set(false);
  }

  setGenerationType(type: 'single' | 'multiple'): void {
    this.pdfGenerationType.set(type);
  }

  addPDFName(): void {
    this.multiplePDFNames.set([...this.multiplePDFNames(), '']);
  }

  removePDFName(index: number): void {
    const names = this.multiplePDFNames();
    names.splice(index, 1);
    this.multiplePDFNames.set([...names]);
  }

  async generatePDF(datos: any, token?: string): Promise<void> {
    try {
      const result = await this.electronService.pythonGenerarPDF(datos, token);

      if (result.success) {
        this.notificationService.success(`PDF generated successfully: ${result.archivo}`);
      } else {
        this.notificationService.error(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error en la llamada a Python:', error);
      this.notificationService.error(`Error: ${error.message}`);
    }
  }

  async generatePDFWithPath(datos: any, outputPath: string, token?: string): Promise<void> {
    try {
      const datosConRuta = { ...datos, ruta_salida: outputPath };
      const result = await this.electronService.pythonGenerarPathPDF(datosConRuta, token);

      if (result.success) {
        this.notificationService.success(`PDF generated at: ${result.ruta}`);
      } else {
        this.notificationService.error(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error en la llamada a Python:', error);
      this.notificationService.error(`Error: ${error.message}`);
    }
  }
}
