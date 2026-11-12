import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
  VariantInputDto,
} from './dto/product.dto';
import { skuPart, slugify } from './slug';

const PRODUCT_INCLUDE = {
  category: true,
  variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
} satisfies Prisma.ProductInclude;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Publico ----------

  listCategories() {
    return this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  listPublicProducts(query: ProductQueryDto) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(query.onSale !== undefined && { isOnSale: query.onSale }),
        ...(query.category && { category: { slug: query.category } }),
        ...(query.q && {
          name: { contains: query.q, mode: 'insensitive' as const },
        }),
      },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicProduct(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  // ---------- Admin ----------

  listAllProducts() {
    return this.prisma.product.findMany({
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async createProduct(dto: CreateProductDto) {
    await this.assertCategory(dto.categoryId);
    this.assertUniqueVariants(dto.variants);
    const slug = await this.uniqueSlug(dto.name);

    return this.prisma.product.create({
      data: {
        ...this.productFields(dto),
        slug,
        variants: {
          create: dto.variants.map((v) => this.variantFields(slug, v)),
        },
      },
      include: PRODUCT_INCLUDE,
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const current = await this.getProductById(id);
    await this.assertCategory(dto.categoryId);
    this.assertUniqueVariants(dto.variants);

    const keepIds = new Set(
      dto.variants.map((v) => v.id).filter((v): v is string => !!v),
    );
    for (const vid of keepIds) {
      if (!current.variants.some((v) => v.id === vid)) {
        throw new BadRequestException(
          `Variante ${vid} no pertenece al producto`,
        );
      }
    }
    const removed = current.variants.filter((v) => !keepIds.has(v.id));
    if (removed.length) {
      const used = await this.prisma.orderItem.count({
        where: { variantId: { in: removed.map((v) => v.id) } },
      });
      if (used > 0) {
        throw new ConflictException(
          'No se puede eliminar una variante que ya tiene pedidos. Pon su stock en 0.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({
        where: { id: { in: removed.map((v) => v.id) } },
      });
      for (const v of dto.variants) {
        if (v.id) {
          // Se conserva el SKU original de una variante existente.
          const { sku: _sku, ...data } = this.variantFields(current.slug, v);
          void _sku;
          await tx.productVariant.update({ where: { id: v.id }, data });
        } else {
          await tx.productVariant.create({
            data: { ...this.variantFields(current.slug, v), productId: id },
          });
        }
      }
      return tx.product.update({
        where: { id },
        data: this.productFields(dto),
        include: PRODUCT_INCLUDE,
      });
    });
  }

  /** Si ya tiene pedidos solo se desactiva (se conserva el historial). */
  async deleteProduct(id: string) {
    await this.getProductById(id);
    const used = await this.prisma.orderItem.count({
      where: { variant: { productId: id } },
    });
    if (used > 0) {
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return { deleted: false, deactivated: true };
    }
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true, deactivated: false };
  }

  // ---------- Helpers ----------

  private productFields(dto: CreateProductDto) {
    return {
      name: dto.name,
      description: dto.description?.trim() || null,
      basePrice: dto.basePrice,
      categoryId: dto.categoryId,
      isOnSale: dto.isOnSale ?? false,
      isActive: dto.isActive ?? true,
      mainImageUrl: dto.mainImageUrl,
      galleryImages: dto.galleryImages ?? [],
    };
  }

  private variantFields(slug: string, v: VariantInputDto) {
    const suffix = randomBytes(2).toString('hex').toUpperCase();
    return {
      size: v.size.toUpperCase(),
      color: v.color,
      stock: v.stock,
      priceOverride: v.priceOverride || null,
      sku: `${skuPart(slug)}-${skuPart(v.size)}-${skuPart(v.color)}-${suffix}`,
    };
  }

  private assertUniqueVariants(variants: VariantInputDto[]) {
    const seen = new Set<string>();
    for (const v of variants) {
      const key = `${v.size.trim().toUpperCase()}|${v.color.trim().toLowerCase()}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          `Variante repetida: talla ${v.size} / color ${v.color}`,
        );
      }
      seen.add(key);
    }
  }

  private async assertCategory(categoryId: string) {
    const exists = await this.prisma.category.count({
      where: { id: categoryId },
    });
    if (!exists) throw new BadRequestException('Categoria no valida');
  }

  private async uniqueSlug(name: string) {
    const base = slugify(name) || 'producto';
    let slug = base;
    for (let i = 2; await this.prisma.product.count({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }
    return slug;
  }
}
