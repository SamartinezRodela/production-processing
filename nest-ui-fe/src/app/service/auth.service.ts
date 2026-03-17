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
  accessToken?: string;
  user?: {
    id: string;
    username: string;
    role: string;
    createdAt: string;
  };
}

export interface JwtPayload {
  sub: string; // user id
  username: string;
  role: string;
  iat: number; // issued at
  exp: number; // expiration
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticated = signal(false);
  private currentUser = signal<AuthResponse['user'] | null>(null);

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
    const token = this.getToken();

    if (token && !this.isTokenExpired(token)) {
      // Token válido, restaurar sesión
      const payload = this.decodeToken(token);
      const user = this.getUserFromStorage();

      this.isAuthenticated.set(true);
      this.currentUser.set(user);
    } else {
      // Token inválido o expirado, limpiar sesión
      this.clearSession();
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const apiUrl = await this.apiUrlService.getApiUrl();

      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${apiUrl}/auth/login`, credentials),
      );

      if (response.success && response.accessToken) {
        // Guardar token JWT
        this.setToken(response.accessToken);

        // Guardar datos del usuario
        if (response.user) {
          this.setUser(response.user);
          this.currentUser.set(response.user);
        }

        // Actualizar estado
        this.isAuthenticated.set(true);

        // Redirigir al home después del login exitoso
        this.router.navigate([ROUTES.HOME]);
      }

      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      this.clearSession();
      throw new Error(error?.error?.message || 'Authentication failed');
    }
  }

  logout(): void {
    this.clearSession();
    this.router.navigate([ROUTES.LOGIN]);
  }

  isUserLoggedIn(): boolean {
    const token = this.getToken();
    return this.isAuthenticated() && !!token && !this.isTokenExpired(token);
  }

  // ==========================================
  // TOKEN MANAGEMENT
  // ==========================================

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  }

  private setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
  }

  private removeToken(): void {
    localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }

    // exp está en segundos, Date.now() en milisegundos
    const expirationDate = payload.exp * 1000;
    const now = Date.now();

    return now >= expirationDate;
  }

  getTokenExpirationDate(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return null;
    }
    return new Date(payload.exp * 1000);
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  private setUser(user: AuthResponse['user']): void {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  private getUserFromStorage(): AuthResponse['user'] | null {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  private removeUser(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  async getCurrentUser(): Promise<AuthResponse['user'] | null> {
    // Si ya tenemos el usuario en memoria, retornarlo
    if (this.currentUser()) {
      return this.currentUser();
    }

    // Si no, intentar obtenerlo del backend
    try {
      const apiUrl = await this.apiUrlService.getApiUrl();
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; user: AuthResponse['user'] }>(`${apiUrl}/auth/me`),
      );

      if (response.success && response.user) {
        this.setUser(response.user);
        this.currentUser.set(response.user);
        return response.user;
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  private clearSession(): void {
    // Limpiar token
    this.removeToken();

    // Limpiar usuario
    this.removeUser();

    // Limpiar datos legacy (compatibilidad)
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);

    // Actualizar signals
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  getUserRole(): string | null {
    const user = this.currentUser();
    return user?.role || null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }
}
