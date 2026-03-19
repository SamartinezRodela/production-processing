import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { errorInterceptor } from '@interceptors/error.interceptor';
import { jwtInterceptor } from '@interceptors/jwt.interceptor';
import { SelectivePreloadingStrategyService } from './selective-preloading-strategy';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        jwtInterceptor, // Agregar token JWT a requests
        errorInterceptor, // Manejar todos los errores HTTP
      ]),
    ),
    provideBrowserGlobalErrorListeners(),
    // provideRouter(routes, withPreloading(PreloadAllModules)),
    provideRouter(routes, withPreloading(SelectivePreloadingStrategyService)),
  ],
};
