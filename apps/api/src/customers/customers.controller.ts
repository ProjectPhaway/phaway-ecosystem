import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { CustomerDetailDto, CustomerSummaryDto } from '@phaway/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CustomersService } from './customers.service';

@ApiTags('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'marketing', 'vendedor')
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@Query('q') q?: string): Promise<CustomerSummaryDto[]> {
    return this.customers.list(q?.trim() || undefined);
  }

  /**
   * El parametro va URL-encoded porque el telefono puede traer + y espacios.
   * Ej: /admin/customers/%2B51%20900%20000%20000
   */
  @Get(':phone')
  detail(@Param('phone') phone: string): Promise<CustomerDetailDto> {
    return this.customers.detail(decodeURIComponent(phone));
  }
}
