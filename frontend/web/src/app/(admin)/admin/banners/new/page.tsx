"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateBanner } from "@/hooks/useBanners";

const bannerSchema = z.object({
  title: z.string().min(3, "Tiêu đề tối thiểu 3 ký tự"),
  link: z.string().optional(),
  position: z.string().min(1, "Vui lòng chọn vị trí"),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  isActive: z.boolean(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

export default function AdminNewBannerPage() {
  const router = useRouter();
  const { mutateAsync: createBanner, isPending } = useCreateBanner();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      link: "",
      position: "HERO",
      isActive: true,
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const onSubmit = async (data: BannerFormValues) => {
    if (!imageUrl) {
      toast.error("Vui lòng tải lên ảnh Banner");
      return;
    }
    try {
      await createBanner({ ...data, imageUrl });
      toast.success("Thêm banner thành công!");
      router.push("/admin/banners");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo banner");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon" asChild>
          <Link href="/admin/banners">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Thêm Banner</h1>
          <p className="text-muted-foreground mt-1">Quản lý banner quảng cáo và chiến dịch</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Thông tin banner</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên chiến dịch / Tiêu đề *</label>
              <Input {...register("title")} placeholder="VD: Sale Mùa Hè 2026" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Đường dẫn liên kết (Link Đích)</label>
              <Input {...register("link")} placeholder="VD: /category/summer-sale" />
            </div>

            <div className="space-y-2pt-2">
              <label className="text-sm font-medium">Vị trí hiển thị *</label>
              <select {...register("position")} className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm text-foreground">
                <option value="HERO">Hero Banner (Trang chủ)</option>
                <option value="SIDEBAR">Sidebar</option>
                <option value="FOOTER">Footer Banner</option>
                <option value="CATEGORY">Trang Danh Mục</option>
              </select>
              {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
            </div>
          </div>

          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Hình ảnh Banner *</h3>
            {imageUrl ? (
              <div className="relative aspect-[21/9] rounded-xl border bg-muted overflow-hidden group">
                <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                <button type="button" onClick={() => setImageUrl(null)} className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed rounded-xl aspect-[21/9] flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium text-center px-2">Tải ảnh lên (Hỗ trợ JPG, PNG, WEBP)</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Thời hạn hiển thị</h3>
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
          </div>

          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Trạng thái</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register("isActive")} className="w-4 h-4 rounded border-gray-300 text-primary" />
                <span className="text-sm font-medium">Kích hoạt banner này</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full shadow-lg shadow-primary/30" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu & Xuất bản"}
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
