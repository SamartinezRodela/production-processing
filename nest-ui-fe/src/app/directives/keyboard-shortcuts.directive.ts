import { Directive, HostListener, Output, EventEmitter, Input } from '@angular/core';

@Directive({
  selector: '[appKeyboardShortcuts]',
  standalone: true,
})
export class KeyboardShortcutsDirective {
  @Input() enableEnter = true;
  @Input() enableEscape = true;
  @Input() enableCtrlS = false;
  @Input() enableCtrlC = false;

  @Input() isActive = true;

  @Output() enterPressed = new EventEmitter<void>();
  @Output() escapePressed = new EventEmitter<void>();
  @Output() ctrlSPressed = new EventEmitter<void>();
  @Output() ctrlCPressed = new EventEmitter<void>();

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.isActive) return;
    //Enter
    if (this.enableEnter && event.key === 'Enter') {
      event.preventDefault();
      this.enterPressed.emit();
    }

    //Escape

    if (this.enableEscape && event.key === 'Escape') {
      event.preventDefault();
      this.escapePressed.emit();
    }

    if (this.enableCtrlS && event.key === 's' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.ctrlSPressed.emit();
    }

    if (this.enableCtrlC && event.key === 'c' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.ctrlCPressed.emit();
    }
  }
}
