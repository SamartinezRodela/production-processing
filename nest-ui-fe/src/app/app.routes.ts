import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
  // ============================================
  // RUTAS PÚBLICAS (solo para NO autenticados)
  // ============================================
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [guestGuard], // ← Agregar esto
  },

  // ============================================
  // RUTAS PROTEGIDAS (requieren autenticación)
  // ============================================
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    canActivate: [authGuard],
    data: { preload: true },
  },
  {
    path: 'Set-Up',
    loadComponent: () => import('./pages/set-up/set-up').then((m) => m.SetUp),
    canActivate: [authGuard],
    data: { preload: true },
  },
  {
    path: 'python-tests',
    loadComponent: () =>
      import('./pages/python-tests/python-tests.component').then((m) => m.PythonTestsComponent),
    canActivate: [authGuard],
    data: { preload: true },
  },

  // ============================================
  // RUTA POR DEFECTO (404 o redirect)
  // ============================================
  {
    path: '**',
    redirectTo: 'login',
  },
];
