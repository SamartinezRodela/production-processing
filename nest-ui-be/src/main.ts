import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ NUEVO: Habilitar validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
      transform: true, // Transforma los tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos implícitamente
      },
    }),
  );
  const isProduction = process.env.NODE_ENV === 'production';
  // Habilitar CORS para que Electron pueda hacer peticiones
  app.enableCors({
    // origin: '*', // En producción, especifica el origen de Electron
    origin: isProduction ? ['http://localhost', 'file://'] : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Backend corriendo en: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
