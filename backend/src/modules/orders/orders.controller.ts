import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import {
  InitCheckoutDto,
  CheckoutAddressDto,
  ApplyVoucherDto,
  ConfirmCheckoutDto,
  OrderFilterDto,
  UpdateOrderStatusDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

// Ghi chú: Interface cho request khi có user
interface AuthenticatedRequest {
  user: { id: string; role: string };
}

// =============================================================================
// CHECKOUT CONTROLLER — luồng mua hàng
// =============================================================================

@ApiTags('Checkout')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-Auth')
export class CheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('init')
  @ApiOperation({ summary: 'Khởi tạo checkout (bước 1)' })
  @ApiResponse({ status: 201, description: 'Checkout session tạo thành công' })
  initCheckout(@Req() req: AuthenticatedRequest, @Body() dto: InitCheckoutDto) {
    return this.ordersService.initCheckout(req.user.id, dto.cartItemIds);
  }

  @Post(':id/address')
  @ApiOperation({ summary: 'Cập nhật địa chỉ giao hàng (bước 2)' })
  updateAddress(
    @Param('id') checkoutId: string,
    @Body() dto: CheckoutAddressDto,
  ) {
    return this.ordersService.updateAddress(checkoutId, dto);
  }

  @Post(':id/voucher')
  @ApiOperation({ summary: 'Áp dụng voucher (bước 3)' })
  applyVoucher(
    @Req() req: AuthenticatedRequest,
    @Param('id') checkoutId: string,
    @Body() dto: ApplyVoucherDto,
  ) {
    return this.ordersService.applyVoucher(
      checkoutId,
      dto.voucherCode,
      req.user.id,
    );
  }

  @Delete(':id/voucher')
  @ApiOperation({ summary: 'Bỏ voucher đã áp' })
  removeVoucher(@Param('id') checkoutId: string) {
    return this.ordersService.removeVoucher(checkoutId);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Xác nhận đặt hàng (bước 4 — tạo đơn)' })
  @ApiResponse({ status: 201, description: 'Đơn hàng đã tạo thành công' })
  confirmCheckout(
    @Req() req: AuthenticatedRequest,
    @Param('id') checkoutId: string,
    @Body() dto: ConfirmCheckoutDto,
  ) {
    return this.ordersService.confirmCheckout(
      checkoutId,
      dto.paymentMethod,
      req.user.id,
      dto.note,
    );
  }
}

// =============================================================================
// USER ORDERS — Lịch sử mua hàng
// =============================================================================

@ApiTags('User Orders')
@Controller('user/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-Auth')
export class UserOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Lịch sử đơn hàng' })
  getUserOrders(
    @Req() req: AuthenticatedRequest,
    @Query() filter: OrderFilterDto,
  ) {
    return this.ordersService.getUserOrders(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn hàng' })
  getUserOrderDetail(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.getUserOrderDetail(req.user.id, orderId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng (User)' })
  @ApiResponse({ status: 200, description: 'Đã hủy đơn hàng' })
  cancelOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() body: { reason?: string },
  ) {
    return this.ordersService.cancelOrder(orderId, req.user.id, body.reason);
  }
}

// =============================================================================
// ADMIN ORDERS
// =============================================================================

@ApiTags('Admin Orders')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth('JWT-Auth')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách đơn hàng (Admin)' })
  getAdminOrders(@Query() filter: OrderFilterDto) {
    return this.ordersService.getAdminOrders(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn hàng (Admin)' })
  getAdminOrderDetail(@Param('id', ParseUUIDPipe) orderId: string) {
    return this.ordersService.getAdminOrderDetail(orderId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng' })
  updateOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, dto, req.user.id);
  }
}
