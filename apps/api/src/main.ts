import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './uploads/uploads.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableCors({
    origin: config
      .get<string>('WEB_ORIGIN', 'http://localhost:5173')
      .split(','),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Imagenes subidas en desarrollo (en produccion se sirven desde R2).
  app.useStaticAssets(UPLOADS_DIR, {
    prefix: '/uploads/',
    maxAge: '30d',
    immutable: true,
  });
  app.enableShutdownHooks();

  await app.listen(config.get<number>('PORT', 3000));
}
void bootstrap();
