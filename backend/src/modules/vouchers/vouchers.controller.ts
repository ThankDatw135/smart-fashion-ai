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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { VouchersService } from './vouchers.service.js';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/index.js';

/**
 * Voucher Controller — Admin CRUD + Public check
 */
@ApiTags('Vouchers')
@Controller()
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  // ===========================================================================
  // ADMIN ENDPOINTS
  // ===========================================================================

  @Post('admin/vouchers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo voucher mới (Admin)' })
  async create(@Body() dto: CreateVoucherDto, @Req() req: any) {
    return this.vouchersService.create(dto, req.user.id as string);
  }

  @Get('admin/vouchers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách voucher (Admin)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['all', 'active', 'expired', 'inactive'],
  })
  async findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('filter') filter?: 'all' | 'active' | 'expired' | 'inactive',
  ) {
    return this.vouchersService.findAll({
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
      filter,
    });
  }

  @Get('admin/vouchers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chi tiết voucher (Admin)' })
  async findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Patch('admin/vouchers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật voucher (Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.vouchersService.update(id, dto);
  }

  @Delete('admin/vouchers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vô hiệu hóa voucher (Admin)' })
  async softDelete(@Param('id') id: string) {
    return this.vouchersService.softDelete(id);
  }

  // ===========================================================================
  // PUBLIC ENDPOINTS
  // ===========================================================================

  @Get('vouchers/check/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra voucher hợp lệ (User)' })
  async checkVoucher(@Param('code') code: string, @Req() req: any) {
    return this.vouchersService.checkVoucher(code, req.user?.id as string);
  }
}
