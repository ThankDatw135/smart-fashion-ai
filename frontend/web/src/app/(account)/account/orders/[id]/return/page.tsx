"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useParams } from "next/navigation";

export default function ReturnOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error("Vui lòng chọn lý do trả hàng.");
      return;
    }

    setIsSubmitting(true);
    // Simulate API Call
    await new Promise((res) => setTimeout(res, 1500));
    setIsSubmitting(false);

    toast.success("Yêu cầu trả hàng đã được gửi và đang chờ xử lý.");
    router.push(`/account/orders/${params.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 bg-background p-6 rounded-2xl border">
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href={`/account/orders/${params.id}`}><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <h1 className="text-2xl font-heading font-bold">Yêu cầu trả hàng / Hoàn tiền</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Bạn đang yêu cầu kích hoạt quá trình trả hàng cho đơn <strong className="text-foreground">{params.id}</strong>. 
        Vui lòng cung cấp lý do chi tiết và hình ảnh đính kèm (nếu có).
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label>Lý do trả hàng <span className="text-destructive">*</span></Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn lý do trả hàng..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="damaged">Sản phẩm bị lỗi / hỏng hóc</SelectItem>
              <SelectItem value="wrong_item">Giao sai sản phẩm / Phân loại</SelectItem>
              <SelectItem value="not_as_described">Không giống mô tả web</SelectItem>
              <SelectItem value="missing_parts">Thiếu phụ kiện / Quà tặng</SelectItem>
              <SelectItem value="other">Lý do khác</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Mô tả chi tiết</Label>
          <Textarea 
            placeholder="Mô tả cụ thể vấn đề bạn gặp phải để chúng tôi xử lý nhanh hơn..." 
            className="h-32 resize-none"
          />
        </div>

        <div className="space-y-3">
          <Label>Hình ảnh bằng chứng (Tối đa 3 ảnh)</Label>
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer">
            <UploadCloud className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="font-medium text-sm">Nhấn để tải ảnh lên (Ảnh lỗi sản phẩm)</p>
            <p className="text-xs text-muted-foreground mt-1">Định dạng JPG, PNG. Nhỏ hơn 5MB.</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t">
          <Button type="button" variant="outline" asChild>
            <Link href={`/account/orders/${params.id}`}>Hủy bỏ</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi yêu cầu..." : "Xác nhận gửi yêu cầu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
