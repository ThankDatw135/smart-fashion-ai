import { Metadata } from "next";
import { CartView } from "./_components/CartView";

export const metadata: Metadata = {
  title: "Giỏ hàng | Smart Fashion AI",
  description: "Trang giỏ hàng Smart Fashion AI - Thanh toán an toàn và nhanh chóng.",
};

export default function CartPage() {
  return <CartView />;
}
