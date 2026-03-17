import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PythonModule } from './python/python.module';
import { PdfModule } from './pdf/pdf.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { OrdersModule } from './orders/orders.module';
import { SettingsModule } from './settings/settings.module';

// ⚠️ TypeORM deshabilitado temporalmente durante la migración
// Descomentar cuando estemos listos para migrar completamente
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Facility } from './database/entities/facility.entity';
// import { Order } from './database/entities/order.entity';
// import { Settings } from './database/entities/settings.entity';
// import * as path from 'path';

@Module({
  imports: [
    // ✅ TypeORM deshabilitado temporalmente
    // TypeOrmModule.forRoot({
    //   type: 'better-sqlite3',
    //   database: getDatabasePath(),
    //   entities: [Facility, Order, Settings],
    //   synchronize: true,
    //   logging: process.env.NODE_ENV !== 'production',
    // }),
    PythonModule,
    PdfModule,
    AuthModule,
    DatabaseModule,
    FacilitiesModule,
    OrdersModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// function getDatabasePath(): string {
//   const isProduction =
//     process.env.NODE_ENV === 'production' ||
//     (process as any).resourcesPath !== undefined;

//   if (isProduction) {
//     let userDataPath: string;

//     if (process.platform === 'darwin') {
//       userDataPath = path.join(
//         process.env.HOME || '~',
//         'Library',
//         'Application Support',
//       );
//     } else if (process.platform === 'win32') {
//       userDataPath =
//         process.env.APPDATA ||
//         path.join(process.env.HOME || '~', 'AppData', 'Roaming');
//     } else {
//       userDataPath = path.join(process.env.HOME || '~', '.config');
//     }

//     const appFolder = path.join(userDataPath, 'Production Processing');
//     return path.join(appFolder, 'database.sqlite');
//   } else {
//     return path.join(process.cwd(), 'data', 'database.sqlite');
//   }
// }
