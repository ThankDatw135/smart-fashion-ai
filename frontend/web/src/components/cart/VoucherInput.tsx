"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket } from "lucide-react";
import { toast } from "sonner";

export function VoucherInput() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (code.toUpperCase() === "WELCOME10") {
        toast.success("Áp dụng mã giảm giá thành công! Giảm 10%.");
      } else {
        toast.error("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      }
    }, 800);
  };

  return (
    <form onSubmit={handleApply} className="flex gap-2">
      <div className="relative flex-1">
        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã giảm giá..." 
          className="pl-9 h-11"
        />
      </div>
      <Button type="submit" disabled={!code.trim() || isLoading} className="h-11 px-6">
        Áp dụng
      </Button>
    </form>
  );
}
