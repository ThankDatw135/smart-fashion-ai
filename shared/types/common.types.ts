// ========================================
// Smart Fashion AI — Các kiểu dữ liệu dùng chung (Common)
// ========================================

/** Dữ liệu cơ bản (Bắt buộc cho mọi bảng) */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Cấu trúc dữ liệu phân trang (Paginated response) */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Tham số truy vấn phân trang */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/** Thông tin hình ảnh chuẩn */
export interface ImageInfo {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

/** Metadata cho SEO (Dùng cả Client lẫn Server) */
export interface SeoMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
}
