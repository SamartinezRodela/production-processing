import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../service/notification.service';
import { Icon } from '../shared/icon/icon';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './notification.html',
  styleUrl: './notification.css',
})
export class Notification {
  notificationService = inject(NotificationService);

  getNotificationClass(type: string): string {
    const baseClass = 'border-l-4 ';
    switch (type) {
      case 'success':
        return (
          baseClass +
          'bg-green-50/95 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-100'
        );
      case 'error':
        return (
          baseClass +
          'bg-red-50/95 dark:bg-red-900/30 border-red-500 text-red-900 dark:text-red-100'
        );
      case 'warning':
        return (
          baseClass +
          'bg-yellow-50/95 dark:bg-yellow-900/30 border-yellow-500 text-yellow-900 dark:text-yellow-100'
        );
      case 'info':
        return (
          baseClass +
          'bg-blue-50/95 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-100'
        );
      default:
        return (
          baseClass +
          'bg-gray-50/95 dark:bg-gray-800/95 border-gray-400 text-gray-900 dark:text-gray-100'
        );
    }
  }

  getIconContainerClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-800/50';
      case 'error':
        return 'bg-red-100 dark:bg-red-800/50';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-800/50';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-800/50';
      default:
        return 'bg-gray-100 dark:bg-gray-700/50';
    }
  }

  getIconColorClass(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  getPositionClass(): string {
    const pos = this.notificationService.position();
    switch (pos) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'check';
      case 'error':
        return 'alert';
      case 'warning':
        return 'alert-triangle';
      case 'info':
        return 'info';
      default:
        return 'bell';
    }
  }
}
