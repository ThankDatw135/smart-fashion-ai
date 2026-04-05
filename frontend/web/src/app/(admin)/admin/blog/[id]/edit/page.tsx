"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateBlogPost } from "@/hooks/useBlog";

const blogSchema = z.object({
  title: z.string().min(5, "Tiêu đề tối thiểu 5 ký tự"),
  summary: z.string().min(10, "Mô tả ngắn tối thiểu 10 ký tự"),
  content: z.string().min(20, "Nội dung bài viết quá ngắn"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  tags: z.string().optional(),
  publishedAt: z.string().min(1, "Vui lòng chọn ngày xuất bản"),
  status: z.string(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export default function AdminEditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  const { mutateAsync: updatePost, isPending } = useUpdateBlogPost();
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: { title: "", summary: "", content: "", categoryId: "", tags: "", status: "published" },
  });

  useEffect(() => {
    // In real app, we would fetch post details via useQuery using blogId
    reset({
      title: "Xu hướng thời trang Mùa Hè 2026",
      summary: "Khám phá những mẫu thiết kế mới nhất cho mùa hè nóng bỏng.",
      content: "<p>Bài viết đang tải từ server...</p>",
      categoryId: "fashion",
      tags: "Mùa Hè, Trending",
      status: "published",
      publishedAt: new Date().toISOString().slice(0, 16),
    });
    setThumbnail("https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600");
  }, [blogId, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(URL.createObjectURL(e.target.files[0]));
    }
  };

  const onSubmit = async (data: BlogFormValues) => {
    try {
      const payload = { ...data, thumbnail, tags: data.tags ? data.tags.split(",").map(t => t.trim()) : [] };
      await updatePost({ id: blogId, data: payload });
      toast.success("Cập nhật bài viết thành công!");
      router.push("/admin/blog");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon" asChild>
          <Link href="/admin/blog">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Sửa Bài Viết</h1>
          <p className="text-muted-foreground mt-1">Cập nhật nội dung bài viết <strong>{blogId}</strong></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Nội dung bài viết</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tiêu đề *</label>
              <Input {...register("title")} placeholder="Nhập tiêu đề bài viết..." />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả ngắn (Summary) *</label>
              <Textarea {...register("summary")} placeholder="Tóm tắt ngắn gọn nội dung bài viết..." className="h-20" />
              {errors.summary && <p className="text-xs text-destructive">{errors.summary.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nội dung (Content) *</label>
              <Textarea {...register("content")} placeholder="Trình soạn thảo HTML / Markdown sẽ được tích hợp tại đây..." className="min-h-[400px]" />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Ảnh Đại Diện</h3>
            {thumbnail ? (
              <div className="relative aspect-video rounded-xl border bg-muted overflow-hidden group">
                <Image src={thumbnail} alt="Thumbnail preview" fill className="object-cover" />
                <button type="button" onClick={() => setThumbnail(null)} className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed rounded-xl aspect-video flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium text-center px-2">Tải ảnh lên</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Tổ chức</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Danh mục Blog *</label>
              <select {...register("categoryId")} className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm text-foreground">
                <option value="">-- Chọn danh mục --</option>
                <option value="fashion">Thời trang & Phối đồ</option>
                <option value="news">Tin tức cửa hàng</option>
                <option value="tips">Mẹo & Cẩm nang</option>
              </select>
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Thẻ (Tags)</label>
              <Input {...register("tags")} placeholder="VD: Mùa Hè, Trending" />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select {...register("status")} className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm">
                <option value="published">Xuất bản ngay</option>
                <option value="draft">Bản nháp</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Ngày xuất bản</label>
              <Input {...register("publishedAt")} type="datetime-local" />
              {errors.publishedAt && <p className="text-xs text-destructive">{errors.publishedAt.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full shadow-lg shadow-primary/30" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Cập Nhật Bài viết"}
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
