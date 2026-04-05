export interface Author {
  id: string;
  name: string;
  avatar: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string; // Tiptap HTML content
  thumbnail: string;
  category: BlogCategory;
  author: Author;
  tags: string[];
  viewCount: number;
  publishedAt: string;
}
