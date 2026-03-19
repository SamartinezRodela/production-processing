import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@services/notification.service';
import { Router } from '@angular/router';
import { ROUTES } from '@config/app.constants';
import { AuthService } from '@services/auth.service';
import { LanguageService } from '@services/language.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const router = inject(Router);
  const authService = inject(AuthService);
  const languageService = inject(LanguageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const t = languageService.t().HTTP_ERRORS;
      let errorMessage: string = t.OCCURRED;

      if (error.error instanceof ErrorEvent) {
        // Error del cliente
        errorMessage = `${t.ERROR} ${error.error.message}`;
      } else {
        // Error del servidor
        switch (error.status) {
          case 401:
            errorMessage = t.UNAUTHORIZED;
            authService.logout();
            router.navigate([ROUTES.LOGIN]);
            break;
          case 403:
            errorMessage = t.FORBIDDEN;
            break;
          case 404:
            errorMessage = t.NOT_FOUND;
            break;
          case 500:
            errorMessage = t.INTERNAL;
            break;
          default:
            errorMessage = error.error?.message || `${t.ERROR} ${error.status}`;
        }
      }

      notificationService.error(errorMessage);
      return throwError(() => new Error(errorMessage));
    }),
  );
};
