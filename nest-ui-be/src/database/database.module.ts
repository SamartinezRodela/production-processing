import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseGateway } from './database.gateway';

@Global() // Hace que el servicio esté disponible en toda la app
@Module({
  providers: [DatabaseService, DatabaseGateway],
  exports: [DatabaseService, DatabaseGateway],
})
export class DatabaseModule {}
