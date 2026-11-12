import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
  UpdatePaymentDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() query: OrderQueryDto) {
    return this.orders.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.get(id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.changeStatus(id, dto.status);
  }

  @Patch(':id/payment')
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.orders.updatePayment(id, dto.paidAmount);
  }
}
