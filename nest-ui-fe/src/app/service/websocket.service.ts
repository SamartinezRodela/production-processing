import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { ApiUrlService } from '@services/api-url.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket | null = null;
  private databaseChanged$ = new Subject<void>();

  constructor(private apiUrlService: ApiUrlService) {}

  async connect(): Promise<void> {
    const apiUrl = await this.apiUrlService.getApiUrl();

    this.socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
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
