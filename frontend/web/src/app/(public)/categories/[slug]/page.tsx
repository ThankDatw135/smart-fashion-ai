import { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductListingClient } from "../../products/_components/ProductListingClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_MAP: Record<string, string> = {
  nam: "Thời Trang Nam",
  nu: "Thời Trang Nữ",
  "phu-kien": "Phụ Kiện",
  dam: "Đầm & Váy",
  ao: "Áo",
  quan: "Quần",
  giay: "Giày",
  "ao-khoac": "Áo Khoác",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = CATEGORY_MAP[slug] || "Danh mục";
  return {
    title: `${title} | Smart Fashion AI`,
    description: `Khám phá bộ sưu tập ${title} mới nhất tại Smart Fashion AI. Gợi ý phối đồ bởi AI.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categoryName = CATEGORY_MAP[slug] || slug;

  return (
    <main className="pt-6 pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Danh mục", href: "/products" },
          { label: categoryName },
        ]}
      />

      <header className="mb-10 lg:mb-12">
        <h1 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight mb-2">
          {categoryName}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Khám phá các sản phẩm {categoryName.toLowerCase()} được gợi ý bởi AI
          Stylist, phù hợp với phong cách riêng của bạn.
        </p>
      </header>

      {/* Reuse ProductListingClient — sẽ nhận categorySlug qua API sau */}
      <ProductListingClient />
    </main>
  );
}
