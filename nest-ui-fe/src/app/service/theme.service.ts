import { Injectable, signal, effect, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Signal para el tema actual
  private currentTheme = signal<Theme>('light');

  // Computed signal para reactividad
  public theme = computed(() => this.currentTheme());

  constructor() {
    this.loadTheme();

    // Effect para aplicar el tema cuando cambie
    effect(() => {
      const theme = this.currentTheme();
      // console.log('Theme changed to:', theme);
      this.applyTheme(theme);
    });
  }

  getTheme(): Theme {
    return this.currentTheme();
  }

  setTheme(theme: Theme): void {
    // console.log('Setting theme to:', theme);
    this.currentTheme.set(theme);
    localStorage.setItem('theme', theme);
    // Aplicar inmediatamente para asegurar el cambio
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    // console.log('Toggling theme from', this.currentTheme(), 'to', newTheme);
    this.setTheme(newTheme);
  }

  isDarkMode(): boolean {
    return this.currentTheme() === 'dark';
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme') as Theme;
    // console.log('Loading theme from localStorage:', savedTheme);
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.currentTheme.set(savedTheme);
      this.applyTheme(savedTheme);
      return;
    }

    // Por defecto, iniciar en modo claro (ignorar preferencia del sistema)
    this.currentTheme.set('light');
    this.applyTheme('light');
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    // console.log('Applying theme:', theme, 'to document element');

    if (theme === 'dark') {
      root.classList.add('dark');
      // console.log('Added dark class. Classes:', root.classList.toString());
    } else {
      root.classList.remove('dark');
      // console.log('Removed dark class. Classes:', root.classList.toString());
    }
  }
}
