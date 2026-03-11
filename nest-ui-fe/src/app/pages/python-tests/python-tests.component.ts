import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PythonTestService } from '../../service/python-test.service';
import { NotificationService } from '../../service/notification.service';
import { SettingsService } from '../../service/set-up/settings.service';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Badge } from '@shared/badge/badge';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

@Component({
  selector: 'app-python-tests',
  standalone: true,
  imports: [CommonModule, Button, Icon, Badge],
  templateUrl: './python-tests.component.html',
  styleUrls: ['./python-tests.component.css'],
})
export class PythonTestsComponent implements OnInit {
  private router = inject(Router);
  private pythonTestService = inject(PythonTestService);
  private notificationService = inject(NotificationService);
  settingsService = inject(SettingsService); // Público para usar en el template
  private cdr = inject(ChangeDetectorRef);

  tests: TestResult[] = [
    { name: 'Prueba Rápida', status: 'pending' },
    { name: 'Verificar Bibliotecas', status: 'pending' },
    { name: 'NumPy', status: 'pending' },
    { name: 'Pandas', status: 'pending' },
    { name: 'Matplotlib', status: 'pending' },
    { name: 'OpenCV', status: 'pending' },
    { name: 'Pillow', status: 'pending' },
    { name: 'SciPy', status: 'pending' },
    { name: 'ReportLab', status: 'pending' },
    { name: 'PyPDF', status: 'pending' },
    { name: 'PyMuPDF', status: 'pending' },
  ];

  allTestsRunning = false;
  pathsVerification: any = null;

  ngOnInit(): void {
    // Verificar rutas al cargar el componente
    this.verifyPathsConfiguration();
  }

  /**
   * Valida que las rutas necesarias estén configuradas
   */
  private validatePaths(): { valid: boolean; message?: string } {
    const basePath = this.settingsService.basePath();
    const outputPath = this.settingsService.outputPath();

    if (!basePath || basePath.trim() === '') {
      return {
        valid: false,
        message: 'Base Path is not configured. Please configure it in Settings.',
      };
    }

    if (!outputPath || outputPath.trim() === '') {
      return {
        valid: false,
        message: 'Output Path is not configured. Please configure it in Settings.',
      };
    }

    return { valid: true };
  }

  /**
   * Regresa a la página de Setup
   */
  goBack(): void {
    this.router.navigate(['/Set-Up']);
  }

  /**
   * Ejecuta todas las pruebas
   */
  async runAllTests(): Promise<void> {
    // Validar configuración antes de ejecutar
    const validation = this.validatePaths();
    if (!validation.valid) {
      this.notificationService.error(validation.message!);
      this.notificationService.warning('Please configure Base Path and Output Path in Settings');
      return;
    }

    this.allTestsRunning = true;
    this.cdr.detectChanges(); // Forzar detección de cambios

    for (const test of this.tests) {
      await this.runTest(test);
      // Pequeña pausa entre pruebas
      await this.delay(500);
    }

    this.allTestsRunning = false;
    this.cdr.detectChanges(); // Forzar detección de cambios
    this.notificationService.success('Todas las pruebas completadas');
  }

  /**
   * Ejecuta una prueba individual
   */
  async runTest(test: TestResult): Promise<void> {
    // Validar configuración antes de ejecutar pruebas que necesitan paths
    const needsValidation = ['Matplotlib', 'OpenCV', 'Pillow', 'ReportLab', 'PyPDF', 'PyMuPDF'];

    if (needsValidation.includes(test.name)) {
      const validation = this.validatePaths();
      if (!validation.valid) {
        this.notificationService.error(validation.message!);
        return;
      }
    }

    test.status = 'running';
    test.error = undefined;
    test.result = undefined;
    this.cdr.detectChanges(); // Forzar detección de cambios

    const startTime = Date.now();

    try {
      let result: any;

      switch (test.name) {
        case 'Prueba Rápida':
          result = await this.pythonTestService.quickTest().toPromise();
          break;
        case 'Verificar Bibliotecas':
          result = await this.pythonTestService.testAllLibraries().toPromise();
          break;
        case 'NumPy':
          result = await this.pythonTestService.testNumpy().toPromise();
          break;
        case 'Pandas':
          result = await this.pythonTestService.testPandas().toPromise();
          break;
        case 'Matplotlib':
          result = await this.pythonTestService.testMatplotlib('lineas').toPromise();
          break;
        case 'OpenCV':
          result = await this.pythonTestService.testOpenCV().toPromise();
          break;
        case 'Pillow':
          result = await this.pythonTestService.testPillow().toPromise();
          break;
        case 'SciPy':
          result = await this.pythonTestService.testScipy().toPromise();
          break;
        case 'ReportLab':
          result = await this.pythonTestService.testReportlab().toPromise();
          break;
        case 'PyPDF':
          // No pasar path - el backend buscará automáticamente en basePath
          result = await this.pythonTestService.testPyPDF().toPromise();
          break;
        case 'PyMuPDF':
          // No pasar path - el backend buscará automáticamente en basePath
          result = await this.pythonTestService.testPyMuPDF().toPromise();
          break;
        default:
          throw new Error('Prueba no implementada');
      }

      test.result = result;
      test.status = 'success';
      test.duration = Date.now() - startTime;
    } catch (error: any) {
      test.status = 'error';
      test.error = error.message || 'Error desconocido';
      test.duration = Date.now() - startTime;
    } finally {
      this.cdr.detectChanges(); // Forzar detección de cambios
    }
  }

  /**
   * Obtiene el ícono según el estado
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'pause';
      case 'running':
        return 'loader';
      case 'success':
        return 'check';
      case 'error':
        return 'x';
      default:
        return 'help-circle';
    }
  }

  /**
   * Obtiene la clase CSS según el estado
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'running':
        return 'status-running';
      case 'success':
        return 'status-success';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  }

  /**
   * Formatea el resultado para mostrar
   */
  formatResult(result: any): string {
    if (!result) return '';
    return JSON.stringify(result, null, 2);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Limpia todos los resultados
   */
  clearResults(): void {
    this.tests.forEach((test) => {
      test.status = 'pending';
      test.result = undefined;
      test.error = undefined;
      test.duration = undefined;
    });
  }

  /**
   * Verifica la configuración de rutas
   */
  async verifyPathsConfiguration(): Promise<void> {
    try {
      this.pathsVerification = await this.pythonTestService.verifyPaths().toPromise();

      // Mostrar notificaciones según el estado
      if (!this.pathsVerification.summary.ready) {
        if (!this.pathsVerification.basePath.configured) {
          this.notificationService.warning('BasePath is not configured');
        } else if (!this.pathsVerification.basePath.exists) {
          this.notificationService.error(
            `BasePath does not exist: ${this.pathsVerification.basePath.path}`,
          );
        } else if (this.pathsVerification.basePath.pdfFiles.length === 0) {
          this.notificationService.warning('No PDF files found in BasePath');
        }

        if (!this.pathsVerification.outputPath.configured) {
          this.notificationService.warning('OutputPath is not configured');
        } else if (!this.pathsVerification.outputPath.exists) {
          this.notificationService.error(
            `OutputPath does not exist: ${this.pathsVerification.outputPath.path}`,
          );
        }
      }
    } catch (error: any) {
      console.error('Error verifying paths:', error);
      this.notificationService.error('Failed to verify paths configuration');
    }
  }
}
