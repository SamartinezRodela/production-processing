// src/app/service/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { STORAGE_KEYS, ROUTES } from '@config/app.constants';
import { firstValueFrom } from 'rxjs';
import { ApiUrlService } from '@services/api-url.service';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    username: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticated = signal(false);
  private currentUser = signal<string | null>(null);

  isLoggedIn = this.isAuthenticated.asReadonly();
  user = this.currentUser.asReadonly();

  constructor(
    private router: Router,
    private http: HttpClient,
    private apiUrlService: ApiUrlService,
  ) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
    const username = localStorage.getItem(STORAGE_KEYS.USERNAME);

    this.isAuthenticated.set(isLoggedIn);
    this.currentUser.set(username);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const apiUrl = await this.apiUrlService.getApiUrl();

      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${apiUrl}/auth/login`, credentials),
      );

      if (response.success) {
        // Guardar sesión
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
        localStorage.setItem(STORAGE_KEYS.USERNAME, credentials.username);
        this.isAuthenticated.set(true);
        this.currentUser.set(credentials.username);

        //Redirigir al home después del login exitoso
        this.router.navigate([ROUTES.HOME]);
      }

      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error?.error?.message || 'Authentication failed');
    }
  }

  logout(): void {
    // Limpiar datos de sesión
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);

    // Actualizar signals
    this.isAuthenticated.set(false);
    this.currentUser.set(null);

    // Redirigir al login
    this.router.navigate([ROUTES.LOGIN]);
  }

  isUserLoggedIn(): boolean {
    return this.isAuthenticated();
  }
}
