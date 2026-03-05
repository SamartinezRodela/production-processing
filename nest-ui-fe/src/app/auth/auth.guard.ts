// src/app/auth/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ROUTES } from '@config/app.constants';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isUserLoggedIn()) {
    return true;
  }

  router.navigate([ROUTES.LOGIN]);
  return false;
};
