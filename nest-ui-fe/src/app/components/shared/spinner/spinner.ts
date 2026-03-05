import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  imports: [CommonModule],
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spinner {
  // Tamaño del spinner
  size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  // Color del spinner
  color = input<'primary' | 'white' | 'gray' | 'success' | 'danger'>('primary');

  // Texto opcional debajo del spinner
  text = input<string>('');

  // Si debe centrarse en la pantalla
  centered = input<boolean>(false);

  // Clases CSS adicionales
  customClass = input<string>('');
}
