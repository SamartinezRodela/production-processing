import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { errorInterceptor } from '@interceptors/error.interceptor';
import { jwtInterceptor } from '@interceptors/jwt.interceptor';
import { authErrorInterceptor } from '@interceptors/auth-error.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        jwtInterceptor, // Agregar token JWT a requests
        authErrorInterceptor, // Manejar errores de autenticación
        errorInterceptor, // Manejar otros errores
      ]),
    ),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
};
