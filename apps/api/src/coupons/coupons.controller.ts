import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/coupon.dto';

@ApiTags('cupones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'marketing')
@Controller('admin/coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  list() {
    return this.coupons.list();
  }

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: { isActive: boolean }) {
    return this.coupons.setStatus(id, !!dto.isActive);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coupons.remove(id);
  }
}
