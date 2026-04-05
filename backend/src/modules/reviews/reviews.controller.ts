import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/index.js';

// Ghi chú: Interface cho request khi có user
interface AuthenticatedRequest {
  user: { id: string; role: string };
}

/**
 * Reviews Controller — Đánh giá sản phẩm
 */
@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tạo đánh giá sản phẩm (User)' })
  async create(
    @Body() dto: CreateReviewDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewsService.create(dto, req.user.id, files);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Danh sách đánh giá sản phẩm (Public)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'rating',
    required: false,
    type: Number,
    description: 'Lọc theo số sao (1-5)',
  })
  findByProduct(
    @Param('productId') productId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('rating') rating?: string,
  ) {
    return this.reviewsService.findByProduct(productId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : 10,
      rating: rating ? parseInt(rating, 10) : undefined,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá của mình (User)' })
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reviewsService.delete(id, req.user.id);
  }
}
