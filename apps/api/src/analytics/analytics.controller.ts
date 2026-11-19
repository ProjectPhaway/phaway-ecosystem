import { Controller, Get, Header, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type {
  DailySalesPoint,
  DashboardKpis,
  LowStockRow,
  OrdersByStatusRow,
  RevenueByCategoryRow,
  TopProductRow,
} from '@phaway/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AnalyticsService } from './analytics.service';
import { RangeQueryDto } from './dto/range.dto';
import { ExportQueryDto } from './dto/export.dto';

@ApiTags('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'marketing', 'vendedor')
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

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(
    @Query() q: RangeQueryDto & ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const report = q.report;
    let filename = `${report}-${q.days ?? 30}.csv`;
    let rows: string[][] = [];

    if (report === 'daily-sales') {
      const data = await this.analytics.dailySales(q.days ?? 30);
      rows = [
        ['fecha', 'pedidos', 'ingresos'],
        ...data.map((r) => [r.date, String(r.orders), r.revenue]),
      ];
    } else if (report === 'top-products') {
      const data = await this.analytics.topProducts(q.days ?? 30, q.limit ?? 5);
      rows = [
        ['producto', 'slug', 'unidades', 'ingresos'],
        ...data.map((r) => [r.name, r.slug, String(r.unitsSold), r.revenue]),
      ];
    } else if (report === 'orders-by-status') {
      const data = await this.analytics.ordersByStatus();
      rows = [['estado', 'cantidad'], ...data.map((r) => [r.status, String(r.count)])];
      filename = 'pedidos-por-estado.csv';
    } else if (report === 'revenue-by-category') {
      const data = await this.analytics.revenueByCategory(q.days ?? 30);
      rows = [
        ['categoria', 'ingresos'],
        ...data.map((r) => [r.name, r.revenue]),
      ];
    } else {
      const data = await this.analytics.lowStock(q.threshold ?? 3);
      rows = [
        ['producto', 'talla', 'color', 'stock'],
        ...data.map((r) => [r.productName, r.size, r.color, String(r.stock)]),
      ];
      filename = 'stock-bajo.csv';
    }

    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(csv);
  }
}

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}
