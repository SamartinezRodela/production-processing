import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { NotificationService } from '@services/notification.service';
import { ROUTES } from '@config/app.constants';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es error 401 (Unauthorized)
      if (error.status === 401) {
        // Mostrar notificación
        notificationService.error('Session expired. Please login again.');

        // Limpiar sesión
        authService.logout();

        // Redirigir al login
        router.navigate([ROUTES.LOGIN]);
      }

      // Si es error 403 (Forbidden)
      if (error.status === 403) {
        notificationService.error('You do not have permission to access this resource.');
      }

      // Propagar el error
      return throwError(() => error);
    }),
  );
};
