import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PythonModule } from './python/python.module';
import { PdfModule } from './pdf/pdf.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    PythonModule,
    PdfModule,
    AuthModule,
    DatabaseModule,
    FacilitiesModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
