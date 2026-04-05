"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateVoucher } from "@/hooks/useVoucher";

const voucherSchema = z.object({
  code: z.string().min(3, "Mã voucher tối thiểu 3 ký tự").toUpperCase(),
  name: z.string().min(5, "Tên chương trình tối thiểu 5 ký tự"),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.coerce.number().min(1, "Giá trị phải lớn hơn 0"),
  minOrderValue: z.coerce.number().optional(),
  maxDiscount: z.coerce.number().optional(),
  usageLimit: z.coerce.number().optional(),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  isActive: z.boolean(),
  isPublic: z.boolean(),
});

type VoucherFormValues = z.infer<typeof voucherSchema>;

export default function AdminEditVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const voucherId = params.id as string;
  const { mutateAsync: updateVoucher, isPending } = useUpdateVoucher();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema) as any,
    defaultValues: {
      code: "", name: "", description: "", discountType: "PERCENTAGE", discountValue: 0, isActive: true, isPublic: true,
    },
  });

  useEffect(() => {
    // In real app, we would fetch voucher details via useQuery here
    // Mocking the loaded data
    reset({
      code: `VOUCHER-${voucherId}`,
      name: "Khuyến mãi đã lưu",
      description: "Đang tải dự liệu từ server mockup...",
      discountType: "PERCENTAGE",
      discountValue: 15,
      minOrderValue: 200000,
      maxDiscount: 50000,
      usageLimit: 100,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
      isActive: true,
      isPublic: true,
    });
  }, [voucherId, reset]);

  const onSubmit = async (data: VoucherFormValues) => {
    try {
      await updateVoucher({ id: voucherId, data: data as any });
      toast.success("Cập nhật voucher thành công!");
      router.push("/admin/vouchers");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật voucher");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon" asChild>
          <Link href="/admin/vouchers">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Sửa Voucher</h1>
          <p className="text-muted-foreground mt-1">Cập nhật thông tin mã voucher <strong>{voucherId}</strong></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mã giảm giá (Code) *</label>
                <Input {...register("code")} placeholder="VD: SUMMER2026" className="uppercase" />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên chương trình *</label>
                <Input {...register("name")} placeholder="VD: Khuyến mãi đón hè..." />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả chi tiết</label>
              <Textarea {...register("description")} placeholder="Mô tả điều kiện sử dụng voucher..." className="min-h-[100px]" />
            </div>
          </div>

          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Cấu hình giảm giá</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại giảm giá</label>
                <select {...register("discountType")} className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm">
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mức giảm *</label>
                <Input {...register("discountValue")} type="number" placeholder="10 hoặc 50000" />
                {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Đơn tối thiểu (VNĐ)</label>
                <Input {...register("minOrderValue")} type="number" placeholder="200000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Giảm tối đa (VNĐ)</label>
                <Input {...register("maxDiscount")} type="number" placeholder="50000" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Thời gian & Giới hạn</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày bắt đầu *</label>
              <Input {...register("startDate")} type="datetime-local" />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày kết thúc *</label>
              <Input {...register("endDate")} type="datetime-local" />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giới hạn số lượng (để trống nếu không giới hạn)</label>
              <Input {...register("usageLimit")} type="number" placeholder="1000" />
            </div>
          </div>

          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Trạng thái</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register("isActive")} className="w-4 h-4 rounded border-gray-300 text-primary" />
                <span className="text-sm font-medium">Kích hoạt voucher (Có thể sử dụng)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register("isPublic")} className="w-4 h-4 rounded border-gray-300 text-primary" />
                <span className="text-sm font-medium">Hiển thị công khai (Cho phép lưu)</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full shadow-lg shadow-primary/30" disabled={isPending}>
              {isPending ? "Đang xử lý..." : "Cập Nhật & Lưu"}
            </Button>
            <Button type="button" variant="outline" className="w-full text-muted-foreground" onClick={() => router.back()}>
              Hủy bỏ
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
