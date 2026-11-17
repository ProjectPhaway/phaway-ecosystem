import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersAdminController, UsersPublicController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersAdminController, UsersPublicController],
  providers: [UsersService],
})
export class UsersModule {}
