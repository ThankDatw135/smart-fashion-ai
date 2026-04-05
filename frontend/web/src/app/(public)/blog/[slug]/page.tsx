import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { BlogCard } from "@/components/blog/BlogCard";

export const metadata: Metadata = {
  title: "Chi tiết bài viết | Antigravity Store",
  description: "Chi tiết nội dung bài viết thời trang",
};

// Mock data (Normally fetch by slug)
const mockPost = {
  id: "1", slug: "xu-huong-thoi-trang-xuan-he-2026",
  title: "Xu Hướng Thời Trang Xuân Hè 2026: Sự Trở Lại Của Tư Duy Tối Giản",
  excerpt: "Năm 2026 đánh dấu sự trở lại của Maximalist nhưng có chọn lọc, kết hợp chất liệu bền vững...",
  coverImage: "/images/products/blazer.jpg",
  category: "Fashion Trend", author: "Anna Nguyen", readTime: "5 phút", publishedAt: new Date()
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: _slug } = await params;
  // If no post found => notFound();
  
  const contentMock = `
    <p>Thời trang chưa bao giờ đứng yên. Năm 2026 chứng kiến những biến động thú vị khi phong cách thời trang dần hướng tới <strong>tính cá nhân hóa</strong> và <strong>bền vững (sustainability)</strong> hơn bao giờ hết.</p>
    
    <h2>1. Chất liệu tự nhiên lên ngôi</h2>
    <p>Cotton hữu cơ, vải lanh (linen), và tơ tằm nguyên bản đang thay thế các loại sợi tổng hợp nhờ khả năng giữ mát, thân thiện với làn da và không gây hại môi trường. Sự dịch chuyển này không chỉ là trend nhất thời mà là xu thế bắt buộc.</p>

    <blockquote>
      "Thời trang bền vững không phải là mặc một chiếc áo cũ, mà là biết chọn mua những chiếc áo có sức sống vượt thời gian." - Tạp chí Vogue chia sẻ.
    </blockquote>

    <h2>2. Bảng màu Pastel dịu mắt</h2>
    <p>Thay vì những gam màu neon chói lóa của năm ngoái, sắc màu Pastel nhẹ nhàng như xanh ngọc, hồng đào, hay vàng bơ (butter yellow) sẽ chiếm lĩnh đường phố. Bạn có thể mix & match chúng dễ dàng cho cả văn phòng hay dạo phố.</p>
    
    <h3>Gợi ý phối đồ</h3>
    <ul>
      <li><strong>Đi làm:</strong> Một chiếc áo sơ mi lanh xanh Pastel kết hợp quần âu ống rộng cạp cao.</li>
      <li><strong>Đi chơi:</strong> Quần short túi hộp (cargo shorts) be nhạt mặc cùng T-shirt trắng basic.</li>
    </ul>

    <p>Hãy cùng Antigravity trải nghiệm bộ sưu tập Xuân Hè 2026 với chất lượng hoàn thiện tuyệt hảo ngay hôm nay.</p>
  `;

  return (
    <div className="container pb-20">
      <ArticleContent post={mockPost} contentHtml={contentMock} />
      
      {/* Related Posts */}
      <div className="max-w-4xl mx-auto pt-10">
        <h3 className="text-2xl font-bold font-heading mb-6">Bài viết cùng chủ đề</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BlogCard post={{...mockPost, title: "10 Cách phối đồ với màu Beige", id: "other"}} variant="compact" />
          <BlogCard post={{...mockPost, title: "Tại sao thời trang bền vững lại quan trọng?", id: "other2"}} variant="compact" />
        </div>
      </div>
    </div>
  );
}
