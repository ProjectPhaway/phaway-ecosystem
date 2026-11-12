import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  AdminProductsController,
  CatalogController,
} from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [AuthModule],
  controllers: [CatalogController, AdminProductsController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
