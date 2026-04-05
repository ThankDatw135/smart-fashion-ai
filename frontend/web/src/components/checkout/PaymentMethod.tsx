"use client";

import { CheckCircle2, ChevronDown, CreditCard, Wallet, Banknote } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PaymentMethodProps {
  value: string;
  onChange: (value: string) => void;
}

export function PaymentMethod({ value, onChange }: PaymentMethodProps) {
  const methods = [
    {
      id: "cod",
      title: "Thanh toán khi nhận hàng (COD)",
      description: "Thanh toán bằng tiền mặt khi shipper giao hàng.",
      icon: Banknote,
      color: "text-emerald-500"
    },
    {
      id: "bank_transfer",
      title: "Chuyển khoản ngân hàng",
      description: "Quét mã QR qua ứng dụng ngân hàng nội địa.",
      icon: Wallet,
      color: "text-blue-500"
    },
    {
      id: "vnpay",
      title: "Thanh toán VNPay",
      description: "Thanh toán trực tuyến an toàn qua thẻ ATM/Visa/MasterCard.",
      icon: CreditCard,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="space-y-6 bg-background rounded-xl p-6 border ring-1 ring-border/50">
      <h3 className="text-lg font-heading font-semibold border-b pb-4">Phương thức thanh toán</h3>

      <RadioGroup value={value} onValueChange={onChange} className="flex flex-col gap-4">
        {methods.map((method) => {
          const Icon = method.icon;
          const isActive = value === method.id;

          return (
            <Label
              key={method.id}
              className={cn(
                "flex cursor-pointer items-start justify-between rounded-xl border p-4 transition-all duration-300",
                isActive ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-4">
                <RadioGroupItem value={method.id} className="mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-base">{method.title}</span>
                  <span className="text-sm text-muted-foreground leading-snug">{method.description}</span>
                </div>
              </div>
              <Icon className={cn("h-6 w-6 shrink-0 mt-1", method.color)} />
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
