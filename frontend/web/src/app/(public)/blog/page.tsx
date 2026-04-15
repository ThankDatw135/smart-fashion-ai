"use client";

import { useBlogPosts } from "@/hooks/useBlog";
import { BlogGrid } from "@/components/blog/BlogGrid";
import { BlogCard } from "@/components/blog/BlogCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

export default function BlogListPage() {
  const { data: res, isLoading } = useBlogPosts();
  const rawPosts = res?.data || [];
  
  // Transform API data to match BlogCard expected format
  const mappedPosts = rawPosts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.summary,
    coverImage: post.thumbnail || "/images/placeholder.jpg",
    category: post.category?.name || "Tin tức",
    author: post.author?.name || "Admin",
    readTime: "5 phút đọc",
    publishedAt: new Date(post.publishedAt || Date.now())
  }));

  const featuredPost = mappedPosts[0];
  const regularPosts = mappedPosts.slice(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải bài viết...</span>
      </div>
    );
  }

  return (
    <div className="container py-12 space-y-16">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Tạp Chí Thời Trang</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Cập nhật xu hướng thời trang, bí quyết mặc đẹp, và khám phá những bộ sưu tập mới nhất để định hình phong cách cá nhân của riêng bạn.
          </p>
        </div>
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Tìm bài viết..." className="pl-10 h-12 rounded-full bg-muted/30 border-muted" />
        </div>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <section>
          <h2 className="text-2xl font-bold font-heading mb-6 border-l-4 border-primary pl-4">Bài viết nổi bật</h2>
          <BlogCard post={featuredPost} variant="featured" />
        </section>
      )}

      {/* Grid Posts */}
      {regularPosts.length > 0 && (
      <section>
        <h2 className="text-2xl font-bold font-heading mb-6 border-l-4 border-primary pl-4">Tin tức & Xu hướng</h2>
        <BlogGrid posts={regularPosts} columns={3} />
      </section>
      )}

      {/* CTA Newsletter */}
      <section className="bg-primary/5 rounded-3xl p-10 text-center max-w-4xl mx-auto border border-primary/20">
        <h2 className="text-2xl font-heading font-bold mb-3">Đừng bỏ lỡ xu hướng mới!</h2>
        <p className="text-muted-foreground mb-8">Đăng ký Email để nhận bộ cẩm nang phối đồ và thông tin sale nội bộ hàng tháng.</p>
        <div className="flex max-w-md mx-auto gap-3">
          <Input placeholder="Nhập email của bạn..." className="h-12 rounded-full" />
          <Button className="h-12 px-8 shadow-sm rounded-full">Đăng ký</Button>
        </div>
      </section>
    </div>
  );
}
