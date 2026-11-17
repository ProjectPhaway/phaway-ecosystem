import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type {
  DailySalesPoint,
  DashboardKpis,
  LowStockRow,
  OrdersByStatusRow,
  RevenueByCategoryRow,
  TopProductRow,
} from '@phaway/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { RangeQueryDto } from './dto/range.dto';

@ApiTags('analytics')
@UseGuards(JwtAuthGuard)
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('kpis')
  kpis(@Query() q: RangeQueryDto): Promise<DashboardKpis> {
    return this.analytics.kpis(q.threshold);
  }

  @Get('daily-sales')
  dailySales(@Query() q: RangeQueryDto): Promise<DailySalesPoint[]> {
    return this.analytics.dailySales(q.days ?? 30);
  }

  @Get('top-products')
  topProducts(@Query() q: RangeQueryDto): Promise<TopProductRow[]> {
    return this.analytics.topProducts(q.days ?? 30, q.limit ?? 5);
  }

  @Get('orders-by-status')
  ordersByStatus(): Promise<OrdersByStatusRow[]> {
    return this.analytics.ordersByStatus();
  }

  @Get('revenue-by-category')
  revenueByCategory(@Query() q: RangeQueryDto): Promise<RevenueByCategoryRow[]> {
    return this.analytics.revenueByCategory(q.days ?? 30);
  }

  @Get('low-stock')
  lowStock(@Query() q: RangeQueryDto): Promise<LowStockRow[]> {
    return this.analytics.lowStock(q.threshold ?? 3);
  }
}
