import { Module, Global } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm'; // ⚠️ Deshabilitado temporalmente
import { DatabaseService } from './database.service';
import { DatabaseGateway } from './database.gateway';
import { JwtModule } from '@nestjs/jwt';
// import { Facility } from './entities/facility.entity';
// import { Order } from './entities/order.entity';
// import { Settings } from './entities/settings.entity';

@Global() // Hace que el servicio esté disponible en toda la app
@Module({
  imports: [
    JwtModule,
    // ✅ TypeORM deshabilitado temporalmente
    // TypeOrmModule.forFeature([Facility, Order, Settings]),
  ],
  providers: [DatabaseService, DatabaseGateway],
  exports: [DatabaseService, DatabaseGateway],
})
export class DatabaseModule {}
