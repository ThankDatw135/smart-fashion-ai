import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';

// Ghi chú: Cache TTL cho dashboard = 5 phút
const DASHBOARD_CACHE_TTL = 300;
const CACHE_PREFIX = 'admin:dashboard';

/**
 * Analytics Service — Admin Dashboard KPI
 * - KPI cards: tổng doanh thu, đơn hàng, users, products
 * - Revenue chart: 30 ngày gần nhất
 * - Top sản phẩm bán chạy
 * - Redis cache 5 phút để giảm tải DB
 *
 * Lưu ý: Order schema dùng `total` (không phải totalAmount)
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ===========================================================================
  // KPI CARDS — Tổng quan
  // ===========================================================================

  async getDashboardKPIs() {
    const cacheKey = `${CACHE_PREFIX}:kpis`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as Record<string, unknown>;

    const today = new Date();
    const startOfMonth = new Date(
      today.getFullYear(), today.getMonth(), 1,
    );
    const startOfLastMonth = new Date(
      today.getFullYear(), today.getMonth() - 1, 1,
    );
    const endOfLastMonth = new Date(
      today.getFullYear(), today.getMonth(), 0,
    );

    const [
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      totalOrders,
      monthlyOrders,
      pendingOrders,
      totalUsers,
      newUsersThisMonth,
      totalProducts,
      activeProducts,
      lowStockCount,
      pendingReturns,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: OrderStatus.completed },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: OrderStatus.completed,
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: OrderStatus.completed,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.pending, OrderStatus.confirmed] },
        },
      }),
      this.prisma.user.count({
        where: { role: UserRole.member },
      }),
      this.prisma.user.count({
        where: {
          role: UserRole.member,
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.productVariant.count({
        where: {
          stockQuantity: { lte: 5 },
          product: { isActive: true },
        },
      }),
      this.prisma.returnRequest.count({
        where: { status: 'pending' },
      }),
    ]);

    const currentMonthRev = Number(monthlyRevenue._sum.total ?? 0);
    const lastMonthRev = Number(lastMonthRevenue._sum.total ?? 0);
    const revenueGrowth = lastMonthRev > 0
      ? ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100
      : 0;

    const result = {
      revenue: {
        total: Number(totalRevenue._sum.total ?? 0),
        thisMonth: currentMonthRev,
        lastMonth: lastMonthRev,
        growthPercent: Math.round(revenueGrowth * 10) / 10,
      },
      orders: {
        total: totalOrders,
        thisMonth: monthlyOrders,
        pending: pendingOrders,
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockCount,
      },
      returns: {
        pending: pendingReturns,
      },
    };

    await this.redis.set(
      cacheKey, JSON.stringify(result), DASHBOARD_CACHE_TTL,
    );
    return result;
  }

  // ===========================================================================
  // REVENUE CHART — Doanh thu 30 ngày
  // ===========================================================================

  async getRevenueChart(days = 30) {
    const cacheKey = `${CACHE_PREFIX}:revenue:${days}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as unknown[];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const rawData: Array<{
      date: string;
      revenue: string;
      order_count: string;
    }> = await this.prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(total), 0)::TEXT as revenue,
        COUNT(*)::TEXT as order_count
      FROM orders
      WHERE status = 'completed'
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Fill missing dates
    const result: Array<{
      date: string;
      revenue: number;
      orderCount: number;
    }> = [];
    const dateMap = new Map(
      rawData.map((r) => [
        r.date,
        {
          revenue: Number(r.revenue),
          orderCount: Number(r.order_count),
        },
      ]),
    );

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const data = dateMap.get(dateStr);
      result.push({
        date: dateStr,
        revenue: data?.revenue ?? 0,
        orderCount: data?.orderCount ?? 0,
      });
    }

    await this.redis.set(
      cacheKey, JSON.stringify(result), DASHBOARD_CACHE_TTL,
    );
    return result;
  }

  // ===========================================================================
  // TOP PRODUCTS — Bán chạy nhất
  // ===========================================================================

  async getTopProducts(limit = 10) {
    const cacheKey = `${CACHE_PREFIX}:top-products:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as unknown[];

    const rawData: Array<{
      product_id: string;
      total_sold: string;
      total_revenue: string;
    }> = await this.prisma.$queryRaw`
      SELECT
        pv.product_id,
        SUM(oi.quantity)::TEXT as total_sold,
        SUM(oi.subtotal)::TEXT as total_revenue
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY pv.product_id
      ORDER BY SUM(oi.quantity) DESC
      LIMIT ${limit}
    `;

    const productIds = rawData.map((r) => r.product_id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        avgRating: true,
        reviewCount: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const result = rawData.map((r) => {
      const product = productMap.get(r.product_id);
      return {
        productId: r.product_id,
        name: product?.name ?? 'Unknown',
        slug: product?.slug ?? '',
        avgRating: product ? Number(product.avgRating) : 0,
        reviewCount: product?.reviewCount ?? 0,
        totalSold: Number(r.total_sold),
        totalRevenue: Number(r.total_revenue),
      };
    });

    await this.redis.set(
      cacheKey, JSON.stringify(result), DASHBOARD_CACHE_TTL,
    );
    return result;
  }

  // ===========================================================================
  // ORDER STATUS SUMMARY
  // ===========================================================================

  async getOrderStatusSummary() {
    const cacheKey = `${CACHE_PREFIX}:order-status`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as unknown[];

    const statusCounts = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const result = statusCounts.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    await this.redis.set(
      cacheKey, JSON.stringify(result), DASHBOARD_CACHE_TTL,
    );
    return result;
  }
}
