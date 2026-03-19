import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SelectivePreloadingStrategyService implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Solo precargar si la ruta tiene data: { preload: true }
    if (route.data && route.data['preload']) {
      return load();
    }
    return of(null);
  }
}
