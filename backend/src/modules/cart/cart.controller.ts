import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { CartService } from './cart.service.js';
import {
  AddCartItemDto,
  UpdateCartItemDto,
  MergeCartDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard.js';

// Ghi chú: Interface cho request object khi có user
interface AuthenticatedRequest {
  user?: { id: string };
}

/**
 * Cart Controller — quản lý giỏ hàng
 * Public (guest): dùng X-Guest-Id header
 * Authenticated: dùng JWT → userId
 */
@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ===========================================================================
  // GET CART — Tự detect guest hoặc user
  // ===========================================================================

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Xem giỏ hàng (auto detect guest/user)' })
  @ApiHeader({ name: 'X-Guest-Id', required: false })
  @ApiResponse({ status: 200, description: 'Giỏ hàng hiện tại' })
  async getCart(
    @Req() req: AuthenticatedRequest,
    @Headers('x-guest-id') guestId?: string,
  ) {
    if (req.user) {
      return this.cartService.getUserCart(req.user.id);
    }
    if (guestId) {
      return this.cartService.getGuestCart(guestId);
    }
    return { items: [], totalItems: 0, subtotal: 0 };
  }

  // ===========================================================================
  // ADD ITEM
  // ===========================================================================

  @Post('items')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiHeader({ name: 'X-Guest-Id', required: false })
  @ApiResponse({ status: 200, description: 'Item đã thêm' })
  @ApiResponse({ status: 400, description: 'Hết hàng hoặc vượt stock' })
  async addItem(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddCartItemDto,
    @Headers('x-guest-id') guestId?: string,
  ) {
    if (req.user) {
      return this.cartService.addUserItem(req.user.id, dto);
    }
    if (guestId) {
      return this.cartService.addGuestItem(guestId, dto);
    }
    return { error: 'Cần có X-Guest-Id header hoặc đăng nhập' };
  }

  // ===========================================================================
  // UPDATE QUANTITY
  // ===========================================================================

  @Put('items/:variantId')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Cập nhật số lượng item trong giỏ' })
  @ApiHeader({ name: 'X-Guest-Id', required: false })
  @ApiResponse({ status: 200, description: 'Đã cập nhật' })
  async updateItem(
    @Req() req: AuthenticatedRequest,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateCartItemDto,
    @Headers('x-guest-id') guestId?: string,
  ) {
    if (req.user) {
      return this.cartService.updateUserItem(req.user.id, variantId, dto);
    }
    if (guestId) {
      return this.cartService.updateGuestItem(guestId, variantId, dto);
    }
    return { error: 'Cần có X-Guest-Id header hoặc đăng nhập' };
  }

  // ===========================================================================
  // REMOVE ITEM
  // ===========================================================================

  @Delete('items/:variantId')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Xóa 1 item khỏi giỏ hàng' })
  @ApiHeader({ name: 'X-Guest-Id', required: false })
  @ApiResponse({ status: 200, description: 'Đã xóa' })
  async removeItem(
    @Req() req: AuthenticatedRequest,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Headers('x-guest-id') guestId?: string,
  ) {
    if (req.user) {
      return this.cartService.removeUserItem(req.user.id, variantId);
    }
    if (guestId) {
      return this.cartService.removeGuestItem(guestId, variantId);
    }
    return { error: 'Cần có X-Guest-Id header hoặc đăng nhập' };
  }

  // ===========================================================================
  // CLEAR CART
  // ===========================================================================

  @Delete()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  @ApiHeader({ name: 'X-Guest-Id', required: false })
  async clearCart(
    @Req() req: AuthenticatedRequest,
    @Headers('x-guest-id') guestId?: string,
  ) {
    if (req.user) {
      return this.cartService.clearUserCart(req.user.id);
    }
    if (guestId) {
      return this.cartService.clearGuestCart(guestId);
    }
    return { items: [], totalItems: 0, subtotal: 0 };
  }

  // ===========================================================================
  // MERGE GUEST → USER
  // ===========================================================================

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Gộp giỏ khách vào giỏ user (khi đăng nhập)' })
  @ApiResponse({ status: 200, description: 'Giỏ hàng đã gộp' })
  async mergeCart(@Req() req: AuthenticatedRequest, @Body() dto: MergeCartDto) {
    return this.cartService.mergeGuestCartToUser(req.user!.id, dto.guestId);
  }
}
