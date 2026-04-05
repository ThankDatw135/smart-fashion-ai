import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  publishedAt: Date;
  readTime: string;
}

interface BlogCardProps {
  post: BlogPost;
  variant?: "default" | "featured" | "compact";
}

export function BlogCard({ post, variant = "default" }: BlogCardProps) {
  if (variant === "featured") {
    return (
      <Link href={`/blog/${post.slug}`} className="group flex flex-col md:flex-row gap-6 md:gap-10 bg-background rounded-3xl overflow-hidden border p-4 md:p-6 transition-colors hover:border-primary/30 hover:shadow-sm">
        <div className="md:w-1/2 rounded-2xl overflow-hidden relative aspect-video md:aspect-auto">
          <Image 
            src={post.coverImage || "/images/placeholder.svg"} 
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="md:w-1/2 flex flex-col justify-center py-2 md:py-8 pr-2">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{post.category}</Badge>
            <span className="text-sm text-muted-foreground">{post.readTime}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4 group-hover:text-primary transition-colors leading-tight">{post.title}</h2>
          <p className="text-muted-foreground mb-6 line-clamp-3 text-base">{post.excerpt}</p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4 text-muted-foreground" />
              {post.author}
            </div>
            <span className="text-sm text-muted-foreground">
              {format(post.publishedAt, "dd MMMM yyyy", { locale: vi })}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/blog/${post.slug}`} className="group flex gap-4 bg-background p-3 rounded-xl hover:bg-muted/50 transition-colors">
        <div className="w-24 h-24 rounded-lg overflow-hidden relative shrink-0">
          <Image src={post.coverImage || "/images/placeholder.svg"} alt={post.title} fill className="object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">{post.title}</h3>
          <p className="text-xs text-muted-foreground mt-2">{format(post.publishedAt, "dd/MM/yyyy")}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col bg-background rounded-3xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image 
          src={post.coverImage || "/images/placeholder.svg"} 
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4">
          <Badge className="backdrop-blur-md bg-background/80 text-foreground hover:bg-background/90">{post.category}</Badge>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <span>{format(post.publishedAt, "dd/MM/yyyy")}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>{post.readTime}</span>
        </div>
        <h3 className="text-xl font-heading font-bold mb-3 group-hover:text-primary transition-colors leading-snug line-clamp-2">{post.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">{post.excerpt}</p>
        <div className="flex items-center text-primary font-medium text-sm mt-auto">
          Đọc tiếp <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
