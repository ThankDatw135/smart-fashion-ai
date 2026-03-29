// ========================================
// Smart Fashion AI — Kiểu dữ liệu Thông báo (Notification)
// ========================================

import type { BaseEntity } from './common.types';
import type { NotificationType } from '../constants/notification-type';

/** Dữ liệu Thông báo */
export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  linkUrl?: string;
  metaData?: Record<string, any>;
}
