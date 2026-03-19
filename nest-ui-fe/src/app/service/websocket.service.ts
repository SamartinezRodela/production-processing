import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { ApiUrlService } from '@services/api-url.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket | null = null;
  private databaseChanged$ = new Subject<void>();

  constructor(
    private apiUrlService: ApiUrlService,
    private authService: AuthService,
    private ngZone: NgZone,
  ) {}

  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket?.on(eventName, (data: any) => {
        this.ngZone.run(() => {
          subscriber.next(data);
        });
      });
    });
  }

  async connect(): Promise<void> {
    // Prevenir que se creen múltiples conexiones si ya estamos conectados
    if (this.socket) return;

    const apiUrl = await this.apiUrlService.getApiUrl();
    const token = this.authService.getToken();
    this.socket = io(apiUrl, {
      auth: {
        token: token,
      },
      // transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('database-changed', (data) => {
      console.log('Database changed:', data);
      this.databaseChanged$.next();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onDatabaseChanged(): Observable<void> {
    return this.databaseChanged$.asObservable();
  }
}
