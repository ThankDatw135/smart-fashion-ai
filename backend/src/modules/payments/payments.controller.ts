import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
import { PaymentsService } from './payments.service.js';
import { ConfirmBankTransferDto, MomoIpnDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

// Ghi chú: Interface cho request
interface AuthenticatedRequest {
  user: { id: string };
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ===========================================================================
  // MoMo
  // ===========================================================================

  @Post('momo/create/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Tạo MoMo payment URL' })
  @ApiResponse({ status: 200, description: 'PayUrl để redirect' })
  createMomoPayment(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.createMomoPayment(orderId);
  }

  @Post('momo/ipn')
  @ApiOperation({ summary: 'MoMo IPN Webhook (callback từ MoMo)' })
  @ApiResponse({ status: 200, description: 'IPN xử lý thành công' })
  handleMomoIpn(@Body() dto: MomoIpnDto) {
    return this.paymentsService.handleMomoIpn(dto);
  }

  // ===========================================================================
  // Bank Transfer
  // ===========================================================================

  @Get('bank-transfer/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Lấy thông tin chuyển khoản cho đơn hàng',
  })
  getBankTransferInfo(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.getBankTransferInfo(orderId);
  }

  @Patch('bank-transfer/:orderId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Admin xác nhận chuyển khoản' })
  confirmBankTransfer(
    @Req() req: AuthenticatedRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: ConfirmBankTransferDto,
  ) {
    return this.paymentsService.confirmBankTransfer(
      orderId,
      req.user.id,
      dto.note,
    );
  }
}
