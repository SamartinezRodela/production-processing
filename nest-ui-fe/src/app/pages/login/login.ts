import { Component, signal, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '@services/theme.service';
import { AuthService } from '@services/auth.service';
import { ROUTES } from '@config/app.constants';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, Button, Icon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  // Inject theme service
  themeService = inject(ThemeService);

  //Campos del Formulario
  username = signal('');
  password = signal('');
  //
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  //

  async onLogin(): Promise<void> {
    this.errorMessage.set('');
    this.isLoading.set(true);

    try {
      const response = await this.authService.login({
        username: this.username(),
        password: this.password(),
      });

      if (response.success) {
        this.router.navigate([ROUTES.HOME]);
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Invalid credentials');
    } finally {
      this.isLoading.set(false);
    }
  }
  // Simular autenticación (reemplaza con tu lógica real)
  private async authenticate(username: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Credenciales de ejemplo (CAMBIAR EN PRODUCCIÓN)
        if (username === 'admin' && password === 'admin123') {
          resolve();
        } else {
          reject(new Error('Invalid username or password'));
        }
      }, 1000);
    });
  }
  // Toggle mostrar/ocultar password
  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  // Limpiar formulario
  clearForm(): void {
    this.username.set('');
    this.password.set('');
    this.errorMessage.set('');
  }
}
