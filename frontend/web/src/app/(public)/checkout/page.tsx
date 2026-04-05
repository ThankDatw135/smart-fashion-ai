import { Metadata } from "next";
import { CheckoutView } from "./_components/CheckoutView";

export const metadata: Metadata = {
  title: "Thanh toán | Antigravity Store",
  description: "Hoàn tất thủ tục thanh toán đơn hàng tại Antigravity Store",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
