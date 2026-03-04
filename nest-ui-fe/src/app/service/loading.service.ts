import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loading = signal(false);
  private requestCount = 0;

  isLoading = this.loading.asReadonly();

  show(): void {
    this.requestCount++;
    this.loading.set(true);
  }

  hide(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.loading.set(false);
    }
  }
}
