import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

const isProduction = process.env.NODE_ENV === 'production';
@WebSocketGateway({
  cors: {
    // origin: '*', // En producción, especifica el origen correcto
    origin: isProduction ? ['http://localhost', 'file://'] : '*',
  },
})
export class DatabaseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('DatabaseGateway');

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(` Client connected: ${client.id}`);

    try {
      // Extraer el token de los headers o del objeto auth de socket.io
      const authHeader = client.handshake.headers.authorization;
      const token =
        (authHeader && authHeader.split(' ')[1]) ||
        client.handshake.auth?.token;

      if (!token) {
        throw new Error('Token no proporcionado');
      }

      // Verificar el token
      const secret = process.env.JWT_SECRET;
      const payload = this.jwtService.verify(token, { secret });

      this.logger.log(
        ` Client connected: ${client.id} (User: ${payload.username})`,
      );
    } catch (error) {
      this.logger.error(
        ` Conexión WebSocket rechazada: ${client.id} - ${error.message}`,
      );
      client.disconnect();
    }
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
