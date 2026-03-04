import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  count?: number;
}

export type NotificationPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);
  position = signal<NotificationPosition>('top-right');

  setPosition(pos: NotificationPosition): void {
    this.position.set(pos);
  }
  private readonly MAX_NOTIFICATION = 5;

  getNotifications = this.notifications.asReadonly();

  show(type: Notification['type'], message: string, duration: number = 3000, title?: string): void {
    const current = this.notifications();

    // Buscar si ya existe una notificación similar
    const existing = current.find((n) => n.message === message && n.type === type);

    if (existing) {
      // Incrementar contador
      existing.count = (existing.count || 1) + 1;
      this.notifications.set([...current]);
      return;
    }

    // Crear nueva notificación
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = { id, type, title, message, duration, count: 1 };

    this.notifications.set([...current, notification]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(message: string, duration?: number, title?: string): void {
    this.show('success', message, duration, title);
  }

  error(message: string, duration?: number, title?: string): void {
    this.show('error', message, duration, title);
  }

  warning(message: string, duration?: number, title?: string): void {
    this.show('warning', message, duration, title);
  }

  info(message: string, duration?: number, title?: string): void {
    this.show('info', message, duration, title);
  }

  //   // Sin título
  // this.notificationService.success('Files processed successfully!');

  // // Con título
  // this.notificationService.success(
  //   'All 25 files have been processed without errors',  // mensaje
  //   3000,                                                 // duración
  //   'Success!'                                            // título
  // );

  // // Otro ejemplo
  // this.notificationService.error(
  //   'Please check your credentials and try again',  // mensaje
  //   5000,                                          // duración
  //   'Authentication Failed'                        // título
  // );

  // // Ejemplo con warning
  // this.notificationService.warning(
  //   'Some files were skipped due to invalid format',   // mensaje
  //   4000,                                              //duracion
  //   'Partial Success'                                  //título
  // );

  remove(id: string): void {
    this.notifications.set(this.notifications().filter((n) => n.id !== id));
  }

  clear(): void {
    this.notifications.set([]);
  }
}
