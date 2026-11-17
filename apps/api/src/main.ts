// Sentry debe cargarse ANTES que cualquier otro modulo para instrumentar Nest.
import './instrument';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './uploads/uploads.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const isProd = config.get<string>('NODE_ENV') === 'production';

  app.setGlobalPrefix('api', { exclude: ['health', 'docs', 'docs-json'] });

  // ===== Seguridad: encabezados HTTP (plan § 19.6) =====
  // Nest + Express: helmet se aplica antes de las rutas.
  // - CSP: en API no sirve HTML "normal" salvo Swagger; permitimos lo que
  //   necesita swagger-ui (estilos y data: images) y bloqueamos el resto.
  // - HSTS: 1 año, incluir subdominios. Solo tiene efecto sobre HTTPS.
  // - X-Frame-Options: DENY (nadie puede embebernos en un iframe).
  // - Referrer-Policy: no filtrar la URL de origen a terceros.
  // - X-Content-Type-Options: nosniff.
  // - X-Powered-By: ocultar (menor fingerprinting).
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          // Swagger UI inyecta estilos inline.
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false, // permitir cargar nuestras imagenes desde el web app
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploads se consumen desde Vercel
      strictTransportSecurity: {
        maxAge: 60 * 60 * 24 * 365, // 1 año
        includeSubDomains: true,
        preload: false, // activar solo tras el chequeo de HSTS Preload List
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' },
    }),
  );

  // ===== CORS: lista blanca explicita (plan § 19.7) =====
  const allowedOrigins = config
    .get<string>('WEB_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, cb) => {
      // Requests server-to-server (curl, Postman) no mandan Origin: aceptamos.
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origen ${origin} no permitido por CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 60 * 60, // cachear preflight 1h
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
  // Capturar excepciones no manejadas y mandarlas a Sentry (si esta activo).
  app.useGlobalFilters(new SentryGlobalFilter(app.getHttpAdapter()));
  app.enableShutdownHooks();

  // Swagger solo en dev y staging. En produccion se apaga con SWAGGER=off.
  if (config.get<string>('SWAGGER', 'on') !== 'off') {
    const doc = new DocumentBuilder()
      .setTitle('Phaway API')
      .setDescription('REST API para el panel y la tienda publica de Phaway.')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'jwt',
      )
      .build();
    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
      customSiteTitle: 'Phaway API Docs',
    });
  }

  await app.listen(config.get<number>('PORT', 3000));
}
void bootstrap();
