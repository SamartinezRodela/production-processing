import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especifica el origen correcto
  },
})
export class DatabaseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('DatabaseGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(` Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(` Client disconnected: ${client.id}`);
  }

  /**
   * Notifica a todos los clientes que la base de datos cambió
   */
  notifyDatabaseChange() {
    this.logger.log('Broadcasting database change to all clients');
    this.server.emit('database-changed', {
      timestamp: new Date().toISOString(),
      message: 'Database has been updated',
    });
  }
}
