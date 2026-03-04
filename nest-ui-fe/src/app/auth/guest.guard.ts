import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { ROUTES } from '../config/app.constants';

/**
 * Guard que protege rutas para usuarios NO autenticados (login, register)
 * Si el usuario YA está autenticado, lo redirige al home
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario NO está autenticado
  if (!authService.isUserLoggedIn()) {
    return true; // ✅ Permitir acceso (usuario no logueado)
  }

  // ❌ Ya está autenticado - redirigir al home
  console.warn('Already logged in. Redirecting to home...');
  router.navigate([ROUTES.HOME]);
  return false;
};
