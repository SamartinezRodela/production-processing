import { Component, input, output, effect, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '../button/button';

@Component({
  selector: 'app-modal',
  imports: [CommonModule, Button],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  isOpen = input<boolean>(false);
  title = input<string>('Modal Title');
  size = input<'sm' | 'md' | 'lg'>('md');

  closed = output<void>();

  constructor(private elementRef: ElementRef) {
    effect(() => {
      if (this.isOpen()) {
        document.body.style.overflow = 'hidden';
        // Agregar clase para efecto blur al contenido de fondo
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.classList.add('modal-blur');
        }
      } else {
        document.body.style.overflow = 'auto';
        // Remover clase de blur
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.classList.remove('modal-blur');
        }
      }
    });
  }

  close() {
    this.closed.emit();
  }

  ngAfterViewInit() {
    // Dar foco al modal cuando se abre
    if (this.isOpen()) {
      setTimeout(() => {
        const modalContainer = this.elementRef.nativeElement.querySelector('.bg-white');
        if (modalContainer) {
          modalContainer.focus();
        }
      }, 150); // ⬅️ Aumentar el timeout
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
