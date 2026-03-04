import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../service/alert.service';
import { Icon } from '../shared/icon/icon';

@Component({
  selector: 'app-alert-container',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class AlertContainer {
  // ← CAMBIO: Alert → AlertContainer
  alertService = inject(AlertService);

  getIconName(type: string): string {
    const icons: Record<string, string> = {
      success: 'check',
      error: 'alert',
      warning: 'alert-triangle',
      info: 'alert',
    };
    return icons[type] || 'alert';
  }

  getAlertClasses(type: string): string {
    const classes: Record<string, string> = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    return classes[type] || classes['info'];
  }

  getIconClasses(type: string): string {
    const classes: Record<string, string> = {
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
    };
    return classes[type] || 'text-gray-800';
  }
}
