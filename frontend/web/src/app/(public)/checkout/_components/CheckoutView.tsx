"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { StepIndicator } from "@/components/checkout/StepIndicator";
import { AddressForm } from "@/components/checkout/AddressForm";
import { PaymentMethod } from "@/components/checkout/PaymentMethod";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addressSchema, AddressFormData } from "@/lib/validators";
import { useCartStore } from "@/stores/cart.store";
import {
  useInitCheckout,
  useSetCheckoutAddress,
  useApplyCheckoutVoucher,
  useConfirmCheckout,
} from "@/hooks/useOrders";

/**
 * C4 REFACTOR: 4-Step Checkout Flow matching backend
 * Step 1: Init (auto) → Step 2: Address → Step 3: Voucher → Step 4: Confirm
 */
export function CheckoutView() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1); // 1=address, 2=voucher, 3=confirm
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [note, setNote] = useState("");

  // Hooks
  const initCheckout = useInitCheckout();
  const setAddress = useSetCheckoutAddress();
  const applyVoucher = useApplyCheckoutVoucher();
  const confirmCheckout = useConfirmCheckout();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phone: "",
      provinceId: "",
      districtId: "",
      wardCode: "",
      address: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Step 0: Auto-init checkout when page loads
  useEffect(() => {
    if (!isMounted || items.length === 0 || checkoutId) return;

    const cartItemIds = items.map((item) => (item as any).id || item.productId);
    initCheckout.mutate(
      { cartItemIds },
      {
        onSuccess: (res) => {
          setCheckoutId(res.data?.checkoutId || res.data?.id);
          setCheckoutData(res.data);
        },
        onError: () => {
          toast.error("Không thể khởi tạo thanh toán. Vui lòng thử lại.");
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  if (!isMounted) return null;

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-4">Giỏ hàng của bạn đang trống</h2>
        <p className="text-muted-foreground mb-6">Bạn chưa có sản phẩm nào để thanh toán.</p>
        <Button asChild>
          <Link href="/products">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  // Step 1: Submit Address
  const handleAddressSubmit = async (data: AddressFormData) => {
    if (!checkoutId) {
      toast.error("Checkout chưa được khởi tạo. Vui lòng tải lại trang.");
      return;
    }

    try {
      const res = await setAddress.mutateAsync({
        checkoutId,
        address: {
          fullName: data.name,
          phone: data.phone,
          province: data.provinceId,
          district: data.districtId,
          ward: data.wardCode,
          addressDetail: data.address,
          saveAsDefault: data.isDefault || false,
        },
      });
      setCheckoutData((prev: any) => ({ ...prev, ...res.data }));
      setCurrentStep(2);
      toast.success("Đã lưu địa chỉ giao hàng!");
    } catch {
      toast.error("Không thể lưu địa chỉ. Vui lòng kiểm tra lại.");
    }
  };

  // Step 2: Apply Voucher
  const handleApplyVoucher = async () => {
    if (!checkoutId || !voucherCode.trim()) return;

    try {
      const res = await applyVoucher.mutateAsync({
        checkoutId,
        voucherCode: voucherCode.trim(),
      });
      setAppliedVoucher(res.data);
      toast.success("Áp dụng voucher thành công!");
    } catch {
      toast.error("Mã voucher không hợp lệ hoặc đã hết hạn.");
    }
  };

  // Step 3: Confirm Order
  const handleConfirm = async () => {
    if (!checkoutId) return;

    try {
      const result = await confirmCheckout.mutateAsync({
        checkoutId,
        paymentMethod,
      });
      clearCart();
      toast.success("Đặt hàng thành công!");
      // Pass orderId to success page for order detail display
      const confirmedOrderId = result?.data?.id || checkoutId;
      router.push(`/checkout/success?orderId=${confirmedOrderId}`);
    } catch {
      toast.error("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    }
  };

  const isProcessing = initCheckout.isPending || setAddress.isPending || applyVoucher.isPending || confirmCheckout.isPending;

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="text-3xl font-heading font-bold mb-8 text-center text-primary">
        Thanh Toán
      </h1>

      <StepIndicator currentStep={currentStep} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
        {/* Left Column — Steps */}
        <div className="lg:col-span-8 space-y-8">
          {/* Step 1: Address */}
          {currentStep === 1 && (
            <div className="bg-background border rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Địa chỉ giao hàng
              </h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddressSubmit)} className="space-y-4">
                  <AddressForm />
                  <div className="flex justify-between items-center pt-4">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/cart"><ArrowLeft className="w-4 h-4 mr-2" /> Quay lại giỏ hàng</Link>
                    </Button>
                    <Button type="submit" disabled={setAddress.isPending}>
                      {setAddress.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</>
                      ) : (
                        <>Tiếp tục <ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Step 2: Voucher */}
          {currentStep === 2 && (
            <div className="bg-background border rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Mã giảm giá
              </h2>
              
              <div className="flex gap-3">
                <Input
                  placeholder="Nhập mã voucher"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="flex-1 h-11"
                />
                <Button 
                  type="button" 
                  onClick={handleApplyVoucher}
                  disabled={applyVoucher.isPending || !voucherCode.trim()}
                >
                  {applyVoucher.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                </Button>
              </div>

              {appliedVoucher && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-400">
                    Giảm {appliedVoucher.discount?.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-6">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                </Button>
                <Button type="button" onClick={() => setCurrentStep(3)}>
                  Tiếp tục <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment & Confirm */}
          {currentStep === 3 && (
            <div className="bg-background border rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Xác nhận & Thanh toán
              </h2>

              <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} />

              <div className="space-y-2">
                <label htmlFor="order-note" className="text-sm font-medium">Ghi chú đơn hàng (tuỳ chọn)</label>
                <Input
                  id="order-note"
                  placeholder="Ví dụ: Giao giờ hành chính"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                </Button>
                <Button 
                  type="button" 
                  size="lg" 
                  onClick={handleConfirm}
                  disabled={confirmCheckout.isPending}
                  className="min-w-[180px]"
                >
                  {confirmCheckout.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xử lý...</>
                  ) : (
                    "Đặt hàng ngay"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Order Summary */}
        <div className="lg:col-span-4">
          <OrderSummary />
          
          {/* Shipping fee from checkout data */}
          {checkoutData?.shippingFee != null && (
            <div className="mt-4 p-4 bg-muted/50 rounded-xl text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="font-medium">{checkoutData.shippingFee.toLocaleString("vi-VN")}đ</span>
              </div>
              {appliedVoucher?.discount && (
                <div className="flex justify-between text-emerald-600">
                  <span>Giảm giá voucher</span>
                  <span>-{appliedVoucher.discount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border rounded-2xl p-8 shadow-lg flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Đang xử lý...</p>
          </div>
        </div>
      )}
    </div>
  );
}
