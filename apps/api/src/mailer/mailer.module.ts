import { Global, Module } from '@nestjs/common';
import { MailerController } from './mailer.controller';
import { MailerService } from './mailer.service';

/**
 * Modulo de correos transaccionales. Es `Global` para que cualquier otro modulo
 * (auth, users, account) pueda inyectar `MailerService` sin importar este modulo
 * explicitamente.
 */
@Global()
@Module({
  controllers: [MailerController],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
