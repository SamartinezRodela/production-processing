import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@services/theme.service';
import { Icon } from '@shared/icon/icon';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      (click)="toggleTheme()"
      class="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    >
      @if (themeService.isDarkMode()) {
        <app-icon [name]="'sun'" [size]="20" class="text-gray-700 dark:text-gray-300" />
      } @else {
        <app-icon [name]="'moon'" [size]="20" class="text-gray-700 dark:text-gray-300" />
      }
    </button>
  `,
})
export class ThemeToggle {
  themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
