import { BlogPost, BlogCard } from "@/components/blog/BlogCard";

interface BlogGridProps {
  posts: BlogPost[];
  columns?: 2 | 3 | 4;
}

export function BlogGrid({ posts, columns = 3 }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center bg-muted/20 rounded-2xl border border-dashed">
        <p className="text-muted-foreground text-lg">Không tìm thấy bài viết nào.</p>
      </div>
    );
  }

  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-8 ${gridCols[columns]}`}>
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} variant="default" />
      ))}
    </div>
  );
}
