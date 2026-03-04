import { Injectable, signal } from '@angular/core';

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  alerts = signal<Alert[]>([]);

  show(alert: Omit<Alert, 'id'>) {
    const id = this.generateId();

    // Crear la alerta con el spread primero, luego asignar duration
    const newAlert: Alert = {
      ...alert,
      id,
      duration: alert.duration !== undefined ? alert.duration : 5000,
    };

    this.alerts.update((alerts) => [...alerts, newAlert]);

    // Auto-cerrar si tiene duración mayor a 0
    if (newAlert.duration && newAlert.duration > 0) {
      setTimeout(() => {
        this.close(id);
      }, newAlert.duration);
    }
  }

  success(title: string, message: string, duration?: number) {
    this.show({ type: 'success', title, message, duration });
  }

  warning(title: string, message: string, duration?: number) {
    this.show({ type: 'warning', title, message, duration });
  }

  error(title: string, message: string, duration?: number) {
    this.show({ type: 'error', title, message, duration });
  }

  info(title: string, message: string, duration?: number) {
    this.show({ type: 'info', title, message, duration });
  }

  close(id: string) {
    this.alerts.update((alerts) => alerts.filter((alert) => alert.id !== id));
  }

  closeAll() {
    this.alerts.set([]);
  }

  private generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
