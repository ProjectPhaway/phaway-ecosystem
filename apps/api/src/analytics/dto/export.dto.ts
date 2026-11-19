import { IsIn } from 'class-validator';

export type AnalyticsReport =
  | 'daily-sales'
  | 'top-products'
  | 'orders-by-status'
  | 'revenue-by-category'
  | 'low-stock';

export class ExportQueryDto {
  @IsIn([
    'daily-sales',
    'top-products',
    'orders-by-status',
    'revenue-by-category',
    'low-stock',
  ])
  report!: AnalyticsReport;
}
