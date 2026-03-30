import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';

/**
 * Reviews Controller — endpoint công khai cho reviews sản phẩm
 * Tách riêng để giữ products.controller gọn
 */
@ApiTags('Products')
@Controller('products')
export class ReviewsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':slug/reviews')
  @ApiOperation({
    summary: 'Lấy danh sách review của sản phẩm (cursor pagination)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách review' })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getReviews(
    @Param('slug') slug: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.getProductReviews(
      slug,
      cursor,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post(':slug/view')
  @ApiOperation({ summary: 'Ghi nhận lượt xem sản phẩm (fire-and-forget)' })
  @ApiResponse({ status: 200, description: 'Đã ghi nhận' })
  async trackView(@Param('slug') slug: string) {
    await this.productsService.trackProductView(slug);
    return { message: 'Đã ghi nhận lượt xem' };
  }
}
