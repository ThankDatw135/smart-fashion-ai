import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { BlogCard } from "@/components/blog/BlogCard";

import { BlogAPI } from "@/services/blog.api";

// export const metadata: Metadata = {
//   title: "Chi tiết bài viết | Antigravity Store",
//   description: "Chi tiết nội dung bài viết thời trang",
// };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await BlogAPI.getPostBySlug(slug);
    const post = res.data;
    return {
      title: `${post.title} | Antigravity Store Blog`,
      description: post.summary,
    };
  } catch (err) {
    return {
      title: "Chi tiết bài viết | Antigravity Store",
      description: "Chi tiết nội dung bài viết thời trang",
    };
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let mappedPost, contentHtml;
  try {
    const res = await BlogAPI.getPostBySlug(slug);
    const post = res.data;
    
    mappedPost = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.summary,
      coverImage: post.thumbnail || "/images/placeholder.jpg",
      category: post.category?.name || "Tin tức",
      author: post.author?.name || "Admin",
      readTime: "5 phút",
      publishedAt: new Date(post.publishedAt || Date.now())
    };
    contentHtml = post.content;
  } catch (err) {
    notFound();
  }

  // Lấy bài viết liên quan (Mock/demo tạm, real: BlogAPI.getPosts({ relatedTo: mappedPost.id }))
  const relatedMockPost = { ...mappedPost, title: "10 Cách phối đồ mùa này", id: "other" };
  const relatedMockPost2 = { ...mappedPost, title: "Thời trang bền vững", id: "other2" };

  return (
    <div className="container pb-20">
      <ArticleContent post={mappedPost} contentHtml={contentHtml} />
      
      {/* Related Posts */}
      <div className="max-w-4xl mx-auto pt-10">
        <h3 className="text-2xl font-bold font-heading mb-6">Bài viết cùng chủ đề</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BlogCard post={relatedMockPost} variant="compact" />
          <BlogCard post={relatedMockPost2} variant="compact" />
        </div>
      </div>
    </div>
  );
}
