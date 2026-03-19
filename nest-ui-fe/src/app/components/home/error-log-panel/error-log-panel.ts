import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '@shared/icon/icon';
import { Badge } from '@shared/badge/badge';
import { Button } from '@shared/button/button';
import { FileError } from '@services/home/error-log.service';
import { LanguageService } from '@services/language.service';

@Component({
  selector: 'app-error-log-panel',
  standalone: true,
  imports: [CommonModule, Icon, Badge, Button],
  templateUrl: './error-log-panel.html',
  styleUrl: './error-log-panel.css',
})
export class ErrorLogPanel {
  languageService = inject(LanguageService);

  errorLog = input.required<FileError[]>();

  clearAll = output<void>();
  removeError = output<number>();
  openOutputFolder = output<void>();
}
