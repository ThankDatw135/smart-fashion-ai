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
import { useUpdateCategory, useCategories } from "@/hooks/useCategories";

const categorySchema = z.object({
  name: z.string().min(2, "Tên danh mục tối thiểu 2 ký tự"),
  slug: z.string().min(2, "Slug tối thiểu 2 ký tự"),
  parentId: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminEditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const { data: categoriesData } = useCategories();
  const { mutateAsync: updateCategory, isPending } = useUpdateCategory();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", parentId: "" },
  });

  useEffect(() => {
    // Mocking finding the category to edit
    const allCategories = categoriesData?.data || [];
    const _recursiveFind = (cats: any[]): any => {
      for (const c of cats) {
        if (c.id === categoryId) return c;
        if (c.children) {
          const found = _recursiveFind(c.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    // Attempt to fill form
    reset({
      name: "Tên Danh Mục Hướng Dẫn",
      slug: "ten-danh-muc",
      parentId: "", // Root category by default
    });
  }, [categoryId, categoriesData, reset]);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      await updateCategory({ id: categoryId, data });
      toast.success("Cập nhật danh mục thành công!");
      router.push("/admin/categories");
    } catch (error) {
      toast.error("Lỗi khi cập nhật danh mục");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon" asChild>
          <Link href="/admin/categories">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Sửa danh mục</h1>
          <p className="text-muted-foreground mt-1">Cập nhật thông tin danh mục <strong>{categoryId}</strong></p>
        </div>
      </div>

      <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tên danh mục *</label>
          <Input {...register("name")} placeholder="VD: Áo Thun Nam" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Slug (Đường dẫn tĩnh) *</label>
          <Input {...register("slug")} placeholder="VD: ao-thun-nam" />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Danh mục cha (Tùy chọn)</label>
          <select {...register("parentId")} className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm text-foreground">
            <option value="">-- Không có (Danh mục gốc) --</option>
            {categoriesData?.data.map((cat) => (
              <option key={cat.id} value={cat.id} disabled={cat.id === categoryId}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Đang xử lý..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </form>
  );
}
