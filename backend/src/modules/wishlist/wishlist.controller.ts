import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { WishlistService } from './wishlist.service.js';

// Ghi chú: Interface cho request khi có user
interface AuthenticatedRequest {
  user: { id: string; role: string };
}

/**
 * Wishlist Controller — Danh sách yêu thích
 */
@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  @ApiOperation({ summary: 'Toggle yêu thích (thêm/xóa)' })
  toggle(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.toggle(req.user.id, productId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách yêu thích' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.wishlistService.findAll(
      req.user.id,
      cursor,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Bỏ yêu thích' })
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.remove(req.user.id, productId);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Kiểm tra đã yêu thích chưa' })
  check(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.check(req.user.id, productId);
  }
}
