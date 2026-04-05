import { CartResponse } from "@/types/cart";
import { MOCK_PRODUCTS } from "./products.mock";

export const MOCK_CART: CartResponse = {
  items: [
    {
      cartItemId: "cart_item_1",
      productId: MOCK_PRODUCTS[0].id,
      name: MOCK_PRODUCTS[0].name,
      slug: MOCK_PRODUCTS[0].slug,
      thumbnail: MOCK_PRODUCTS[0].thumbnail,
      price: MOCK_PRODUCTS[0].price,
      originalPrice: MOCK_PRODUCTS[0].originalPrice,
      quantity: 2,
      variant: {
        size: "M",
        color: "Đen",
      },
    },
    {
      cartItemId: "cart_item_2",
      productId: MOCK_PRODUCTS[1].id,
      name: MOCK_PRODUCTS[1].name,
      slug: MOCK_PRODUCTS[1].slug,
      thumbnail: MOCK_PRODUCTS[1].thumbnail,
      price: MOCK_PRODUCTS[1].price,
      quantity: 1,
      variant: {
        size: "L",
        color: "Xanh Đậm",
      },
    },
  ],
  subtotal: MOCK_PRODUCTS[0].price * 2 + MOCK_PRODUCTS[1].price,
  totalQuantity: 3,
};
