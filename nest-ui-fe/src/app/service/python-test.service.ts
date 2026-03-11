import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { ApiUrlService } from './api-url.service';

@Injectable({
  providedIn: 'root',
})
export class PythonTestService {
  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService,
  ) {}

  /**
   * Helper para construir URLs dinámicamente
   */
  private buildUrl(endpoint: string): Observable<string> {
    return from(this.apiUrlService.getApiUrl()).pipe(
      switchMap((baseUrl) => {
        return from(Promise.resolve(`${baseUrl}/python/test${endpoint}`));
      }),
    );
  }

  /**
   * Prueba rápida de todas las bibliotecas
   */
  quickTest(): Observable<any> {
    return this.buildUrl('/quick').pipe(switchMap((url) => this.http.get(url)));
  }

  /**
   * Verifica que todas las bibliotecas estén instaladas
   */
  testAllLibraries(): Observable<any> {
    return this.buildUrl('/libraries').pipe(switchMap((url) => this.http.get(url)));
  }

  /**
   * Prueba NumPy
   */
  testNumpy(): Observable<any> {
    return this.buildUrl('/numpy').pipe(switchMap((url) => this.http.get(url)));
  }

  /**
   * Prueba Pandas
   */
  testPandas(): Observable<any> {
    return this.buildUrl('/pandas').pipe(switchMap((url) => this.http.get(url)));
  }

  /**
   * Prueba NumPy y Pandas combinados
   */
  testNumpyPandas(): Observable<any> {
    return this.buildUrl('/numpy-pandas').pipe(switchMap((url) => this.http.get(url)));
  }

  /**
   * Prueba ReportLab (crear PDF)
   */
  testReportlab(outputPath?: string): Observable<any> {
    return this.buildUrl('/reportlab').pipe(
      switchMap((url) =>
        this.http.post(url, {
          outputPath: outputPath || 'test_reportlab.pdf',
        }),
      ),
    );
  }

  /**
   * Prueba Matplotlib (crear gráfico)
   */
  testMatplotlib(
    tipo: 'lineas' | 'barras' | 'dispersion' | 'pastel',
    outputPath?: string,
  ): Observable<any> {
    return this.buildUrl('/matplotlib').pipe(
      switchMap((url) =>
        this.http.post(url, {
          tipo,
          outputPath: outputPath || `test_matplotlib_${tipo}.png`,
        }),
      ),
    );
  }

  /**
   * Prueba OpenCV (crear imagen)
   */
  testOpenCV(outputPath?: string): Observable<any> {
    return this.buildUrl('/opencv').pipe(
      switchMap((url) =>
        this.http.post(url, {
          outputPath: outputPath || 'test_opencv.png',
        }),
      ),
    );
  }

  /**
   * Prueba Pillow (crear imagen)
   */
  testPillow(outputPath?: string): Observable<any> {
    return this.buildUrl('/pillow').pipe(
      switchMap((url) =>
        this.http.post(url, {
          outputPath: outputPath || 'test_pillow.png',
        }),
      ),
    );
  }

  /**
   * Prueba SciPy
   */
  testScipy(): Observable<any> {
    return this.buildUrl('/scipy').pipe(switchMap((url) => this.http.get(url)));
  }

  /**
   * Prueba PyPDF (leer PDF)
   */
  testPyPDF(pdfPath?: string): Observable<any> {
    return this.buildUrl('/pypdf').pipe(switchMap((url) => this.http.post(url, { pdfPath })));
  }

  /**
   * Prueba PyMuPDF (analizar PDF)
   */
  testPyMuPDF(pdfPath?: string): Observable<any> {
    return this.buildUrl('/pymupdf').pipe(switchMap((url) => this.http.post(url, { pdfPath })));
  }

  /**
   * Verifica la configuración de rutas (basePath y outputPath)
   */
  verifyPaths(): Observable<any> {
    return this.buildUrl('').pipe(
      switchMap((baseUrl) => {
        const url = baseUrl.replace('/test', '/verify-paths');
        return this.http.get(url);
      }),
    );
  }
}
