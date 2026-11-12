import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

/** Endpoints publicos del catalogo. */
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  categories() {
    return this.catalog.listCategories();
  }

  @Get('products')
  products(@Query() query: ProductQueryDto) {
    return this.catalog.listPublicProducts(query);
  }

  @Get('products/:slug')
  product(@Param('slug') slug: string) {
    return this.catalog.getPublicProduct(slug);
  }
}

/** Endpoints del panel admin (requieren login). */
@UseGuards(JwtAuthGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list() {
    return this.catalog.listAllProducts();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.catalog.getProductById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.catalog.createProduct(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalog.updateProduct(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catalog.deleteProduct(id);
  }
}
