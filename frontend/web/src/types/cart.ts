export interface CartStateItem {
  cartItemId: string; // Khác với productId, mỗi variation là 1 item ID riêng
  productId: string;
  name: string;
  slug: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  variant: {
    color: string;
    size: string;
  };
}

export interface CartResponse {
  items: CartStateItem[];
  subtotal: number;
  totalQuantity: number;
}
