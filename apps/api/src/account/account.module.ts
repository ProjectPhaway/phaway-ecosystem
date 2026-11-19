import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [UploadsModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
