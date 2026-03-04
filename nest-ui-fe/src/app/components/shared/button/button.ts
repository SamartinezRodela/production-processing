import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-button',
  imports: [CommonModule, Icon],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  label = input<string>('Button');
  type = input<'button' | 'submit' | 'reset'>('button');
  variant = input<'primary' | 'secondary' | 'danger' | 'dark' | 'white' | 'ghost'>('primary');
  disabled = input<boolean>(false);
  size = input<'sm' | 'md' | 'lg'>('md');
  customClass = input<string>('');

  clicked = output<void>();

  // Nuevos inputs para el icono
  icon = input<string>('');
  iconPosition = input<'left' | 'right' | 'only'>('left');
  iconSize = input<number>(20);

  onClick() {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
