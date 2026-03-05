import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '@shared/icon/icon';

@Component({
  selector: 'app-badge',
  imports: [Icon, CommonModule],
  templateUrl: './badge.html',
  styleUrl: './badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  label = input<string>('');

  variant = input<'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'>(
    'primary',
  );

  size = input<'sm' | 'md' | 'lg'>('md');

  icon = input<string>('');
  iconPosition = input<'left' | 'right'>('left');

  dot = input<boolean>(false);

  removable = input<boolean>(false);

  customClass = input<string>('');

  removed = output<void>();

  onRemoved() {
    this.removed.emit();
  }
}
