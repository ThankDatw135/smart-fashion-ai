"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Loader2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VouchersAPI } from "@/services/vouchers.api";
import { format } from "date-fns";

const voucherSchema = z.object({
  code: z.string().min(3, "Mã voucher tối thiểu 3 ký tự"),
  name: z.string().min(5, "Tên chương trình tối thiểu 5 ký tự"),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.preprocess(Number, z.number().min(1, "Giá trị phải lớn hơn 0")),
  minOrderValue: z.preprocess(Number, z.number().optional()),
  maxDiscount: z.preprocess(Number, z.number().optional()),
  usageLimit: z.preprocess(Number, z.number().optional()),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  isActive: z.boolean(),
  isPublic: z.boolean(),
});

type VoucherFormValues = z.infer<typeof voucherSchema>;

function formatDatetimeLocal(dateStr: string) {
  try {
    return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

export default function AdminEditVoucherPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const voucherId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "voucher", voucherId],
    queryFn: () => VouchersAPI.getVoucherById(voucherId),
    enabled: !!voucherId,
  });

  const voucher = data?.data;

  const updateMutation = useMutation({
    mutationFn: (formData: Partial<VoucherFormValues>) =>
      VouchersAPI.updateVoucher(voucherId, formData as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "voucher", voucherId] });
      toast.success("Cập nhật voucher thành công!");
      router.push("/admin/vouchers");
    },
    onError: () => toast.error("Có lỗi xảy ra khi cập nhật voucher."),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema) as any,
    defaultValues: {
      discountType: "PERCENTAGE",
      isActive: true,
      isPublic: true,
    },
  });

  useEffect(() => {
    if (voucher) {
      reset({
        code: voucher.code || "",
        name: (voucher as any).name || "",
        description: (voucher as any).description || "",
        discountType: voucher.discountType as "PERCENTAGE" | "FIXED_AMOUNT" || "PERCENTAGE",
        discountValue: voucher.discountValue || 0,
        minOrderValue: voucher.minOrderValue || undefined,
        maxDiscount: (voucher as any).maxDiscount || undefined,
        usageLimit: voucher.usageLimit || undefined,
        startDate: voucher.startDate ? formatDatetimeLocal(voucher.startDate) : "",
        endDate: voucher.endDate ? formatDatetimeLocal(voucher.endDate) : "",
        isActive: voucher.isActive ?? true,
        isPublic: (voucher as any).isPublic ?? true,
      });
    }
  }, [voucher, reset]);

  const onSubmit = async (data: VoucherFormValues) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải voucher...</span>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium">Không tìm thấy voucher.</p>
        <Button variant="outline" asChild>
          <Link href="/admin/vouchers"><ChevronLeft className="w-4 h-4 mr-2" /> Quay lại</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon" asChild>
          <Link href="/admin/vouchers"><ChevronLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Chỉnh sửa Voucher</h1>
          <p className="text-muted-foreground mt-1">
            Cập nhật mã: <span className="font-mono font-semibold text-foreground">{voucher.code}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin cơ bản */}
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
              <Textarea {...register("description")} placeholder="Mô tả điều kiện sử dụng..." className="min-h-[80px]" />
            </div>
          </div>

          {/* Cấu hình giảm giá */}
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
          {/* Thời gian & giới hạn */}
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
              <label className="text-sm font-medium">Giới hạn số lượng</label>
              <Input {...register("usageLimit")} type="number" placeholder="1000 (để trống nếu không giới hạn)" />
            </div>
          </div>

          {/* Trạng thái */}
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Trạng thái</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register("isActive")} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium">Kích hoạt (Có thể sử dụng)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register("isPublic")} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium">Hiển thị công khai</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full shadow-lg shadow-primary/30" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</>
              ) : "Cập Nhật Voucher"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
              Hủy bỏ
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
