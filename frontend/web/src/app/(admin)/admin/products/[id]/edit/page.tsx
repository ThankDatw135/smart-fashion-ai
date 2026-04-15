"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Upload, Plus, Trash2, X, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/useCategories";
import { useUpdateProduct, useProductBySlug } from "@/hooks/useProducts";

const productSchema = z.object({
  name: z.string().min(3, "Tên sản phẩm tối thiểu 3 ký tự"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  tags: z.string().optional(),
  status: z.string(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // Dùng useProductBySlug (slug thường là id khi truyền từ link /admin/products/:id/edit)
  const { data: productResp, isLoading } = useProductBySlug(productId);
  const product = productResp?.data;

  const { data: categoriesResp } = useCategories();
  const categories = categoriesResp?.data || [];
  const { mutateAsync: updateProduct, isPending } = useUpdateProduct();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", categoryId: "", tags: "", status: "active" },
  });

  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    if (product) {
      reset({
        name: product.name || "",
        description: product.description || "",
        categoryId: product.categoryId || "",
        tags: product.tags?.join(", ") || "",
        status: (product as any).status || "active",
      });
      setImages(product.images || []);
      setVariants((product.variants as any[]) || []);
    }
  }, [product, reset]);

  const addVariant = () => {
    setVariants([...variants, { id: `new_${Date.now()}`, size: "", color: "", price: "", stock: "", sku: "" }]);
  };

  const updateVariant = (id: string, field: string, value: string) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesUrl = Array.from(e.target.files).map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...filesUrl]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (variants.length === 0) {
      toast.error("Vui lòng thêm ít nhất một biến thể");
      return;
    }
    try {
      const payload = {
        ...data,
        images,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
        variants: variants.map((v: any) => ({
          ...v,
          stock: Number(v.stock ?? v.stockQuantity ?? 0),
          price: Number(v.price ?? v.basePrice ?? 0),
        })),
      };
      await updateProduct({ id: productId, data: payload as any });
      toast.success("Cập nhật sản phẩm thành công!");
      router.push("/admin/products");
    } catch {
      toast.error("Có lỗi xảy ra khi cập nhật");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 rounded-3xl bg-muted" />
            <div className="h-32 rounded-3xl bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-24 rounded-3xl bg-muted" />
            <div className="h-40 rounded-3xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium">Không tìm thấy sản phẩm.</p>
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon" asChild>
          <Link href="/admin/products">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Chỉnh sửa Sản phẩm</h1>
          <p className="text-muted-foreground mt-1">
            Cập nhật thông tin: <span className="font-semibold text-foreground">{product.name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin cơ bản */}
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên sản phẩm *</label>
              <Input {...register("name")} placeholder="VD: Áo Thun Polo Trơn..." />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả sản phẩm</label>
              <Textarea
                {...register("description")}
                placeholder="Viết mô tả chi tiết về sản phẩm..."
                className="min-h-[200px]"
              />
            </div>
          </div>

          {/* Hình ảnh */}
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Hình ảnh</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl border bg-muted overflow-hidden group">
                  <Image
                    src={src.startsWith("blob:") || src.startsWith("http") || src.startsWith("/") ? src : `/${src}`}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium text-center px-2">Tải ảnh lên</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          {/* Biến thể */}
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Phân loại & Biến thể</h3>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-2" /> Thêm biến thể
              </Button>
            </div>
            <div className="text-sm border rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium">Kích cỡ</th>
                    <th className="p-3 font-medium">Màu sắc</th>
                    <th className="p-3 font-medium">Giá bán</th>
                    <th className="p-3 font-medium">Tồn kho</th>
                    <th className="p-3 font-medium">SKU</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {variants.map((variant) => (
                    <tr key={variant.id}>
                      <td className="p-3">
                        <Input
                          value={variant.size || ""}
                          onChange={(e) => updateVariant(variant.id, "size", e.target.value)}
                          className="w-20 h-8"
                          placeholder="Size"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={variant.color || ""}
                          onChange={(e) => updateVariant(variant.id, "color", e.target.value)}
                          className="w-24 h-8"
                          placeholder="Màu sắc"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={variant.price ?? variant.basePrice ?? ""}
                          onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                          type="number"
                          className="w-28 h-8"
                          placeholder="Giá"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={variant.stock ?? variant.stockQuantity ?? ""}
                          onChange={(e) => updateVariant(variant.id, "stock", e.target.value)}
                          type="number"
                          className="w-20 h-8"
                          placeholder="SL"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={variant.sku || ""}
                          onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
                          className="h-8"
                          placeholder="SKU"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeVariant(variant.id)}
                          disabled={variants.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column - sidebar */}
        <div className="space-y-6">
          {/* Trạng thái */}
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Trạng thái</h3>
            <select {...register("status")} className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm">
              <option value="active">Hiển thị (Đang bán)</option>
              <option value="draft">Bản nháp (Đang ẩn)</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>

          {/* Tổ chức */}
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Tổ chức</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Danh mục *</label>
              <select
                {...register("categoryId")}
                className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm text-foreground"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
            </div>
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Nhãn (Tags)</label>
              <Input {...register("tags")} placeholder="VD: Mới, Sale, Bán chạy" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full shadow-lg shadow-primary/30" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Cập Nhật & Lưu"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-muted-foreground"
              onClick={() => router.back()}
            >
              Bỏ qua thay đổi
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
