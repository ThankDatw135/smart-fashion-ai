import {
  AbilityBuilder,
  PureAbility,
  AbilityClass,
  InferSubjects,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

/**
 * Định nghĩa action — các hành động có thể thực hiện
 */
type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

/**
 * Định nghĩa subject — các entity trong hệ thống
 */
type Subject =
  | 'User'
  | 'Product'
  | 'Order'
  | 'Review'
  | 'Voucher'
  | 'Blog'
  | 'Banner'
  | 'Category'
  | 'Notification'
  | 'AdminSetting'
  | 'all';

export type AppAbility = PureAbility<[Action, Subject]>;

/**
 * CASL Ability Factory — tạo permission set dựa trên role + context
 *
 * RBAC cứng:
 * - member: đọc public, CRUD tài nguyên cá nhân (order, review, address)
 * - admin: quản lý products, orders, vouchers, blog, banners
 * - super_admin: toàn quyền (manage all)
 *
 * ABAC động:
 * - Ownership check: user chỉ sửa/xóa tài nguyên của mình
 * - VIP tier: một số voucher chỉ dành cho Gold/Diamond
 */
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: { id: string; role: string }) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      PureAbility as AbilityClass<AppAbility>,
    );

    switch (user.role) {
      case 'super_admin':
        // Super Admin — toàn quyền
        can('manage', 'all');
        break;

      case 'admin':
        // Admin — quản lý sản phẩm, đơn hàng, nội dung
        can('manage', 'Product');
        can('manage', 'Category');
        can('manage', 'Order');
        can('manage', 'Voucher');
        can('manage', 'Blog');
        can('manage', 'Banner');
        can('read', 'User');
        can('read', 'Notification');
        can('read', 'AdminSetting');
        // Không được xóa user hoặc sửa admin settings
        cannot('delete', 'User');
        cannot('manage', 'AdminSetting');
        break;

      case 'member':
      default:
        // Member — chỉ đọc public + CRUD tài nguyên cá nhân
        can('read', 'Product');
        can('read', 'Category');
        can('read', 'Blog');
        can('read', 'Banner');
        // Ghi chú: ABAC ownership check được thực hiện ở Service layer
        // VD: orderService.cancel() kiểm tra order.userId === user.id
        can('create', 'Order');
        can('read', 'Order');
        can('create', 'Review');
        can('read', 'Review');
        can('read', 'Notification');
        break;
    }

    return build();
  }
}
