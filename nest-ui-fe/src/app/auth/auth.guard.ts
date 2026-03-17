// src/app/auth/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ROUTES } from '@config/app.constants';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está logueado y el token es válido
  if (authService.isUserLoggedIn()) {
    return true;
  }

  // Si no está logueado o el token expiró, redirigir al login
  router.navigate([ROUTES.LOGIN]);
  return false;
};
