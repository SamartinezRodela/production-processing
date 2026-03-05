import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {
  //Titulo Opcional del Card
  title = input<string>('');

  //Subtitulo opcional
  subtitle = input<string>('');

  //Variante del card
  variant = input<'default' | 'interactive' | 'bordered' | 'elevated'>('default');

  // Paddin Personalizado
  padding = input<'none' | 'sm' | 'md' | 'lg'>('md');

  //Class css Adicionales
  customClass = input<string>('');

  //Si el card es clickeable
  clickable = input<boolean>(false);
}
