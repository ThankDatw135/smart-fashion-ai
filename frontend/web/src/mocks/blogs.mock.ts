import { BlogPost } from "@/types/blog";

export const MOCK_BLOGS: BlogPost[] = [
  {
    id: "blog_1",
    title: "Xu hướng thời trang Thu Đông 2024",
    slug: "xu-huong-thoi-trang-thu-dong-2024",
    summary: "Điểm qua những màu sắc, chất liệu và phong cách dự kiến sẽ lên ngôi trong mùa mốt tới.",
    content: "<p>Hãy cùng Smart Fashion AI khám phá...</p>",
    thumbnail: "/images/blogs/blog-1.jpg",
    category: {
      id: "bcat_1",
      name: "Xu Hướng (Trending)",
      slug: "xu-huong",
    },
    author: {
      id: "admin_1",
      name: "Nguyên Khang (Fashion Editor)",
      avatar: "https://i.pravatar.cc/150?u=editor",
    },
    tags: ["fashion", "trend", "winter"],
    viewCount: 1542,
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "blog_2",
    title: "Bí quyết mix & match đồ Basic",
    slug: "bi-quyet-mix-match-do-basic",
    summary: "Dù chỉ có áo thun và quần jean, bạn vẫn có thể biến hóa đầy phong cách.",
    content: "<p>Áo thun basic luôn là best-seller. Làm sao để mặc đẹp?</p>",
    thumbnail: "/images/blogs/blog-2.jpg",
    category: {
      id: "bcat_2",
      name: "Tips & Phối Đồ",
      slug: "tips-phoi-do",
    },
    author: {
      id: "admin_2",
      name: "Minh Anh (Stylist)",
      avatar: "https://i.pravatar.cc/150?u=stylist",
    },
    tags: ["tips", "basic", "mixmatch"],
    viewCount: 856,
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
