import { Order } from "@/types/order";
import { MOCK_PRODUCTS } from "./products.mock";

export const MOCK_ORDERS: Order[] = [
  {
    id: "ord_001",
    orderNumber: "SF-20260403-001",
    userId: "usr_001",
    status: "delivered",        // lowercase — match backend
    items: [
      {
        id: "item_1",
        productId: MOCK_PRODUCTS[0].id,
        variantId: "var_001",
        productName: MOCK_PRODUCTS[0].name,
        variantInfo: "M / Đen",
        price: MOCK_PRODUCTS[0].price,
        quantity: 1,
        imageUrl: MOCK_PRODUCTS[0].thumbnail,
      },
    ],
    subtotal: 150000,
    shippingFee: 25000,
    discountAmount: 0,
    discount: 0,
    total: 175000,
    paymentMethod: "cod",       // lowercase — match backend
    paymentStatus: "success",   // lowercase — match backend
    // Flat shipping fields — match backend schema
    shippingName: "Nguyễn Văn A",
    shippingPhone: "0901234567",
    shippingAddress: "123 Đường Nam Kỳ Khởi Nghĩa",
    shippingWard: "Phường Võ Thị Sáu",
    shippingDistrict: "Quận 3",
    shippingProvince: "Hồ Chí Minh",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ord_002",
    orderNumber: "SF-20260403-002",
    userId: "usr_001",
    status: "pending",          // lowercase
    items: [
      {
        id: "item_2",
        productId: MOCK_PRODUCTS[1].id,
        variantId: "var_002",
        productName: MOCK_PRODUCTS[1].name,
        variantInfo: "L / Xanh Đậm",
        price: MOCK_PRODUCTS[1].price,
        quantity: 1,
        imageUrl: MOCK_PRODUCTS[1].thumbnail,
      },
    ],
    subtotal: 350000,
    shippingFee: 0,
    discountAmount: 50000,
    discount: 50000,
    total: 300000,
    paymentMethod: "bank_transfer", // lowercase
    paymentStatus: "pending",       // lowercase
    shippingName: "Nguyễn Văn A",
    shippingPhone: "0901234567",
    shippingAddress: "123 Đường Nam Kỳ Khởi Nghĩa",
    shippingWard: "Phường Võ Thị Sáu",
    shippingDistrict: "Quận 3",
    shippingProvince: "Hồ Chí Minh",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
