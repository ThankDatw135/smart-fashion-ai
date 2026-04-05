import { Clock, Tag, User } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { BlogPost } from "./BlogCard";
import { Badge } from "@/components/ui/badge";

interface ArticleContentProps {
  post: BlogPost;
  contentHtml: string;
}

export function ArticleContent({ post, contentHtml }: ArticleContentProps) {
  return (
    <article className="max-w-4xl mx-auto py-8 lg:py-12 px-4 md:px-0">
      <header className="mb-10 text-center">
        <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1 text-sm bg-primary/10 text-primary">{post.category}</Badge>
        <h1 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight max-w-3xl mx-auto">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center"><User className="w-4 h-4" /></div>
            Bởi {post.author}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {format(post.publishedAt, "dd MMMM, yyyy", { locale: vi })}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            {post.readTime}
          </div>
        </div>
      </header>

      <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-12 border bg-muted">
        <Image 
          src={post.coverImage || "/images/placeholder.svg"} 
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div 
        className="prose prose-lg dark:prose-invert max-w-3xl mx-auto prose-headless prose-a:text-primary prose-img:rounded-3xl prose-headings:font-heading prose-headings:font-bold"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      
      <div className="max-w-3xl mx-auto mt-12 py-8 border-y flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5 text-muted-foreground" />
          <div className="flex gap-2">
            <Badge variant="outline">Fashion</Badge>
            <Badge variant="outline">Trend</Badge>
            <Badge variant="outline">Style</Badge>
          </div>
        </div>
      </div>
    </article>
  );
}
