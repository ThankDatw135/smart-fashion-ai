// Mẫu dữ liệu tham khảo từ Backend
export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice?: number;
  description: string;
  shortDescription?: string;
  images: string[];
  thumbnail: string;
  categoryId: string;
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isFlashSale?: boolean;
  soldCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string | null;
  children?: Category[];
}
