import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AnalyticsService } from './analytics.service.js';

/**
 * Admin Dashboard Controller — KPI & Biểu đồ
 */
@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'KPI Cards — Tổng quan doanh thu, đơn hàng, users' })
  getKPIs() {
    return this.analyticsService.getDashboardKPIs();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Biểu đồ doanh thu N ngày gần nhất' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  getRevenue(@Query('days') days?: string) {
    return this.analyticsService.getRevenueChart(
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top sản phẩm bán chạy nhất' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  getTopProducts(@Query('limit') limit?: string) {
    return this.analyticsService.getTopProducts(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('order-status')
  @ApiOperation({ summary: 'Phân bố trạng thái đơn hàng' })
  getOrderStatus() {
    return this.analyticsService.getOrderStatusSummary();
  }
}
