import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { AccountModule } from './account/account.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { CouponsModule } from './coupons/coupons.module';
import { CustomersModule } from './customers/customers.module';
import { HealthController } from './health/health.controller';
import { MailerModule } from './mailer/mailer.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // SentryModule debe ir PRIMERO para instrumentar los decoradores de Nest.
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting global: 300 req/min por IP. Login tiene su propio limite (5/min).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    MailerModule,
    AuthModule,
    AccountModule,
    AnalyticsModule,
    CatalogModule,
    CouponsModule,
    CustomersModule,
    UploadsModule,
    OrdersModule,
    SettingsModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
