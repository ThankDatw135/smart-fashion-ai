/**
 * Order Types — Matches backend Prisma schema exactly
 * Backend uses lowercase status (pending, confirmed, shipping...)
 * Backend field names: orderNumber, shippingName, shippingPhone... (flat)
 */

// Lowercase — matches Prisma OrderStatus enum
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled"
  | "return_requested"
  | "returned";

// Lowercase — matches Prisma PaymentMethod enum
export type PaymentMethod = "cod" | "bank_transfer" | "momo";

// Lowercase — matches Prisma PaymentStatus enum
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  // Backend stores snapshot fields:
  productName: string;       // snapshot name
  variantInfo: string;       // e.g. "M / Đen"
  price: number;
  quantity: number;
  imageUrl?: string | null;
  // Frontend convenience aliases (mapped from backend response)
  name?: string;             // alias for productName
  thumbnail?: string | null; // alias for imageUrl
  variant?: {
    color: string;
    size: string;
  };
}

/**
 * Order — Full order type matching backend response
 * Backend returns flat shipping fields, not nested shippingAddress object
 */
export interface Order {
  id: string;
  orderNumber: string;       // e.g. "SF-20260403-001"
  userId: string;
  status: OrderStatus;
  items: OrderItem[];

  // Financials (Prisma Decimal → serialized as number)
  subtotal: number;
  shippingFee: number;
  discountAmount: number;    // Backend field name
  total: number;
  discount: number;          // Alias for discountAmount (frontend compat)

  // Voucher
  voucherId?: string | null;

  // Shipping — FLAT fields from backend (not nested object)
  shippingName: string;       // recipient name
  shippingPhone: string;      // recipient phone
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingAddress: string;    // address detail line (NOT a nested object!)
  note?: string | null;

  // Payment
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  payment?: {
    id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: number;
    paidAt?: string | null;
    transactionId?: string | null;
  };

  // Cancel info
  cancelledBy?: string | null;
  cancelReason?: string | null;

  // Relations
  user?: {
    id: string;
    fullName: string | null;
    email: string;
    phone?: string | null;
  };
  voucher?: {
    code: string;
    type: string;
    value: number;
  } | null;
  statusHistory?: {
    id: string;
    status: string;
    note?: string | null;
    createdAt: string;
    changer?: { fullName: string | null } | null;
  }[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy compat alias — some components use Order.code
 * Use order.orderNumber in new code
 */
export type { Order as AdminOrder };
