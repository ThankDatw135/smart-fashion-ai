"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCategory, useCategories } from "@/hooks/useCategories";

const categorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
  slug: z.string().optional(),
  parentId: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminNewCategoryPage() {
  const router = useRouter();
  const { mutateAsync: createCategory, isPending } = useCreateCategory();
  // Lấy list categories để cho phép chọn parent
  const { data: categoriesResp } = useCategories();
  const categories = categoriesResp?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      parentId: "",
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      // Tự sinh slug nếu rỗng
      const payload = {
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/ /g, "-"),
      };
      await createCategory(payload);
      toast.success("Thêm danh mục thành công!");
      router.push("/admin/categories");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm danh mục");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/categories">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Thêm Danh mục mới</h1>
          <p className="text-muted-foreground mt-1">
            Khởi tạo danh mục sản phẩm, phục vụ phân loại và hiển thị.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl bg-card rounded-3xl p-6 border shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên Danh mục *</label>
            <Input {...register("name")} placeholder="Ví dụ: Áo thun nam" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Đường dẫn tĩnh (Slug)</label>
            <Input {...register("slug")} placeholder="ao-thun-nam" />
            <p className="text-xs text-muted-foreground">Tự động tạo từ tên nếu để trống.</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Danh mục cha</label>
            <select 
              {...register("parentId")}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm text-foreground"
            >
              <option value="">-- Không có (Danh mục gốc) --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="pt-4 flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu danh mục"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/categories">Hủy</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
