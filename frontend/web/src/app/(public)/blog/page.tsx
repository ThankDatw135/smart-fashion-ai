import { Metadata } from "next";
import { BlogGrid } from "@/components/blog/BlogGrid";
import { BlogCard } from "@/components/blog/BlogCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & Tin tức thời trang | Antigravity Store",
  description: "Cập nhật xu hướng thời trang mới nhất, mẹo phối đồ và tin tức từ Antigravity",
};

// Mock data
const mockPosts = [
  {
    id: "1", slug: "xu-huong-thoi-trang-xuan-he-2026",
    title: "Xu Hướng Thời Trang Xuân Hè 2026: Sự Trở Lại Của Tối Giản",
    excerpt: "Năm 2026 đánh dấu sự trở lại mạnh mẽ của phong cách Minimalist (Tối giản), tập trung vào chất liệu tự nhiên, bền vững và phom dáng rộng thoải mái...",
    coverImage: "/images/products/blazer.jpg",
    category: "Fashion Trend", author: "Anna Nguyen", readTime: "5 phút đọc", publishedAt: new Date()
  },
  {
    id: "2", slug: "cach-phoi-do-voi-ao-polo-cho-nam-gioi",
    title: "Bí Quyết Phối Đồ Với Áo Polo Cho Nam Giới Trẻ Trung, Lịch Lãm",
    excerpt: "Áo polo luôn là 'must-have item' trong tủ đồ nam giới. Tuy nhiên, mặc sao cho vừa gọn gàng vừa thể hiện đúng chất riêng thì không phải ai cũng rành...",
    coverImage: "/images/products/tshirt.jpg",
    category: "Style Guide", author: "John Tran", readTime: "8 phút đọc", publishedAt: new Date()
  },
  {
    id: "3", slug: "ai-stylist-tu-van-cach-chon-do",
    title: "AI Stylist: Công Nghệ Đang Thay Đổi Cách Chúng Ta Chọn Đồ Giao Mùa",
    excerpt: "Khám phá cách Trí tuệ nhân tạo (AI) tại Antigravity Store phân tích vóc dáng và đưa ra những gợi ý trang phục 'đo ni đóng giày' cho bạn.",
    coverImage: "/images/products/sneaker.jpg",
    category: "Tech x Fashion", author: "Kevin Le", readTime: "4 phút đọc", publishedAt: new Date()
  },
  {
    id: "4", slug: "bo-suu-tap-moi-mua-thu",
    title: "Ra Mắt Bộ Sưu Tập Thu Đông: Warmth & Elegance",
    excerpt: "Tìm hiểu chi tiết bộ sưu tập Thu Đông mới nhất vừa lên kệ nhà Antigravity với điểm nhấn là chất liệu dạ tweed chống lạnh cao cấp...",
    coverImage: "/images/products/jeans.jpg",
    category: "News", author: "Admin", readTime: "3 phút đọc", publishedAt: new Date()
  }
];

export default function BlogListPage() {
  const featuredPost = mockPosts[0];
  const regularPosts = mockPosts.slice(1);

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
      <section>
        <h2 className="text-2xl font-bold font-heading mb-6 border-l-4 border-primary pl-4">Bài viết nổi bật</h2>
        <BlogCard post={featuredPost} variant="featured" />
      </section>

      {/* Grid Posts */}
      <section>
        <h2 className="text-2xl font-bold font-heading mb-6 border-l-4 border-primary pl-4">Tin tức & Xu hướng</h2>
        <BlogGrid posts={regularPosts} columns={3} />
      </section>

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
