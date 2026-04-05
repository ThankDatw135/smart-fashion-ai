import { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductDetailClient } from "./_components/ProductDetailClient";

// Trong thực tế sẽ fetch từ API dựa trên slug
interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    const res = await fetch(`${apiUrl}/products/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Product not found");
    
    const { data: product } = await res.json();
    return {
      title: `${product.name} | Smart Fashion AI`,
      description: product.shortDescription || `Mua ${product.name} chính hãng tại Smart Fashion AI. Miễn phí vận chuyển cho đơn từ 500K.`,
      openGraph: {
        images: product.images && product.images.length > 0 ? [product.images[0]] : [],
      }
    };
  } catch (error) {
    // Fallback if API fails
    const fallbackName = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      title: `${fallbackName} | Smart Fashion AI`,
      description: `Mua ${fallbackName} chính hãng tại Smart Fashion AI. Miễn phí vận chuyển cho đơn từ 500K.`,
    };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <main className="pt-6 pb-20 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Cửa hàng", href: "/products" },
          { label: "Đầm", href: "/categories/dam" },
          { label: "Chi tiết sản phẩm" },
        ]}
      />
      <ProductDetailClient slug={slug} />
    </main>
  );
}
