import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para que Electron pueda hacer peticiones
  app.enableCors({
    origin: '*', // En producción, especifica el origen de Electron
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend corriendo en: http://localhost:3000`);
}
bootstrap();
