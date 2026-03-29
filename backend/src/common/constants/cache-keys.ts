/**
 * Redis key patterns — chuẩn hóa tên key cho toàn bộ app
 * Tránh xung đột key, dễ invalidation
 */
export const CACHE_KEYS = {
  // Sản phẩm
  PRODUCT_LIST: (hash: string) => `products:list:${hash}`,
  PRODUCT_DETAIL: (slug: string) => `products:detail:${slug}`,
  PRODUCT_RELATED: (slug: string) => `products:related:${slug}`,

  // Danh mục
  CATEGORY_TREE: 'categories:tree',

  // Giỏ hàng khách
  GUEST_CART: (guestId: string) => `cart:guest:${guestId}`,

  // Checkout session
  CHECKOUT_SESSION: (sessionId: string) => `checkout:${sessionId}`,
  STOCK_LOCK: (variantId: string) => `stock:lock:${variantId}`,

  // JWT blacklist (logout)
  TOKEN_BLACKLIST: (jti: string) => `auth:blacklist:${jti}`,

  // OTP
  OTP: (email: string) => `auth:otp:${email}`,
  OTP_ATTEMPTS: (email: string) => `auth:otp:attempts:${email}`,

  // Admin dashboard
  DASHBOARD: (key: string) => `dashboard:${key}`,

  // Mutex lock — chống cache stampede
  MUTEX: (key: string) => `mutex:${key}`,
} as const;
