import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductFilterDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ImageUploadService } from './image-upload.service.js';

/**
 * Products Controller
 * Public: GET /products, GET /products/:slug
 * Admin: CRUD /admin/products
 */
@ApiTags('Products')
@Controller()
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  // ===========================================================================
  // PUBLIC — DANH SÁCH & CHI TIẾT
  // ===========================================================================

  @Get('products')
  @ApiOperation({ summary: 'Danh sách sản phẩm (filter + cursor pagination)' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm phân trang' })
  async findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findAll(filter);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Chi tiết sản phẩm theo slug' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm đầy đủ' })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get('products/:slug/related')
  @ApiOperation({ summary: 'Sản phẩm liên quan (cùng danh mục)' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm liên quan' })
  async findRelated(@Param('slug') slug: string) {
    return this.productsService.findRelated(slug);
  }

  // ===========================================================================
  // ADMIN — CRUD SẢN PHẨM
  // ===========================================================================

  @Post('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth('JWT-Auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 8))
  @ApiOperation({ summary: '[Admin] Tạo sản phẩm mới (kèm upload ảnh)' })
  @ApiResponse({ status: 201, description: 'Sản phẩm đã tạo' })
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Upload ảnh nếu có
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.imageUploadService.uploadProductImages(files);
    }

    return this.productsService.create(dto, imageUrls);
  }

  @Put('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: '[Admin] Cập nhật sản phẩm' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã cập nhật' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: '[Admin] Ẩn sản phẩm (soft delete)' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã ẩn' })
  async softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.softDelete(id);
  }

  // ===========================================================================
  // ADMIN — QUẢN LÝ VARIANTS
  // ===========================================================================

  @Post('admin/products/:id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: '[Admin] Thêm variant cho sản phẩm' })
  async addVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    data: {
      size: string;
      color: string;
      colorCode?: string;
      stockQuantity: number;
    },
  ) {
    return this.productsService.addVariant(id, data);
  }

  @Put('admin/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: '[Admin] Cập nhật variant (stock, color, size)' })
  async updateVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body()
    data: Partial<{
      size: string;
      color: string;
      colorCode: string;
      stockQuantity: number;
      isActive: boolean;
    }>,
  ) {
    return this.productsService.updateVariant(variantId, data);
  }
}
