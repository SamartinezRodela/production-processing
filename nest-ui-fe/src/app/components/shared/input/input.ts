import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Icon } from '@shared/icon/icon';

@Component({
  selector: 'app-input',
  imports: [FormsModule, CommonModule, Icon],
  templateUrl: './input.html',
  styleUrl: './input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input {
  label = input<string>('');
  type = input<string>('text');
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  value = model<string>('');
  customClass = input<string>('');
  inputClass = input<string>('');

  // Nuevos inputs para el icono
  icon = input<string>('');
  iconPosition = input<'left' | 'right'>('left');
  iconSize = input<number>(20);

  // Signal para controlar visibilidad de contraseña
  showPassword = signal(false);

  // Método para obtener el tipo de input actual
  getInputType() {
    if (this.type() === 'password' && this.showPassword()) {
      return 'text';
    }
    return this.type();
  }

  // Toggle para mostrar/ocultar contraseña
  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }
}
