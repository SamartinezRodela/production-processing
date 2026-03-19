import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class PythonGateway {
  @WebSocketServer()
  server: Server;

  emitProgress(progress: number, details?: any): void {
    this.server.emit('python-progress', { progress, ...details });
  }
}
