"use client";

import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { api } from "@/services/api";
import { Product } from "@/types/product";
import { useWishlistStore } from "@/hooks/useWishlist";

const MOCK_FALLBACKS: Record<string, any> = {
  "fp1": { id: "fp1", name: "Áo Khoác Blazer Form Rộng", slug: "ao-khoac-blazer-form-rong", price: 1250000, thumbnail: "/images/products/blazer.jpg" },
  "fp2": { id: "fp2", name: "Áo Thun Cotton Organic Premium", slug: "ao-thun-cotton-organic-premium", price: 450000, thumbnail: "/images/products/tshirt.jpg" },
  "fp3": { id: "fp3", name: "Quần Jeans Denim Phom Suông", slug: "quan-jeans-denim-phom-suong", price: 890000, thumbnail: "/images/products/jeans.jpg" },
  "fp4": { id: "fp4", name: "Giày Sneaker Da Bê Trắng", slug: "giay-sneaker-da-be-trang", price: 1500000, thumbnail: "/images/products/sneaker.jpg" },
  "prod_1": { id: "prod_1", name: "Đầm Dạ Hội Xanh Cổ Điển Satin", slug: "dam-da-hoi-xanh", price: 850000, thumbnail: "/images/products/blazer.jpg" },
  "dam-nhung-xanh-ngoc": { id: "dam-nhung-xanh-ngoc", name: "Đầm Nhung Xanh Ngọc", slug: "dam-nhung-xanh-ngoc", price: 920000, thumbnail: "/images/products/blazer.jpg" },
  "vay-lua-den": { id: "vay-lua-den", name: "Váy Lụa Đen Tối Giản", slug: "vay-lua-den", price: 750000, thumbnail: "/images/products/tshirt.jpg" },
  "dam-dinh-ket": { id: "dam-dinh-ket", name: "Đầm Đính Kết Dạ Hội", slug: "dam-dinh-ket", price: 1550000, thumbnail: "/images/products/jeans.jpg" },
  "vay-xoe-lua": { id: "vay-xoe-lua", name: "Váy Xòe Lụa Hồng Phấn", slug: "vay-xoe-lua", price: 820000, thumbnail: "/images/products/sneaker.jpg" },
};

export default function WishlistPage() {
  const [serverProducts, setServerProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const items = useWishlistStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchWishlist = async () => {
      try {
        const res = await api.get("/wishlist");
        
        // Backend trả về: { items: [...], pagination: {...} }
        // Xử lý linh hoạt nhiều kiểu response khác nhau
        const raw = res.data;
        let items: any[] = [];
        
        if (Array.isArray(raw)) {
          items = raw;
        } else if (Array.isArray(raw?.items)) {
          items = raw.items;
        } else if (Array.isArray(raw?.data)) {
          items = raw.data;
        } else {
          items = [];
        }
        
        const products = items
          .filter((w: any) => w.product) // bỏ qua entry không có product
          .map((w: any) => ({
            ...w.product,
            id: w.product.id,
            thumbnail: w.product.thumbnail || w.product.images?.[0]?.imageUrl || "/images/placeholder.svg",
          }));
        setServerProducts(products);
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  // Tính toán linh hoạt kết hợp Mock và Real (để xoá là biến mất ngay)
  const serverIds = serverProducts.map((p) => p.id);
  const mockFallbacks = items
    .filter(id => !serverIds.includes(id))
    .map(id => MOCK_FALLBACKS[id])
    .filter(Boolean) as Product[];

  const displayProducts = [...serverProducts, ...mockFallbacks].filter((p) =>
    items.includes(p.id)
  );

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">Sản phẩm yêu thích</h1>
        <p className="text-sm text-muted-foreground">Lưu trữ danh sách thời trang bạn muốn mua vào bất kỳ lúc nào.</p>
      </div>

      {isLoading ? (
        <ProductGrid products={[]} isLoading={true} />
      ) : displayProducts.length > 0 ? (
        <ProductGrid products={displayProducts} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-background/50 border border-dashed rounded-xl">
          <p className="text-muted-foreground">Bạn chưa yêu thích sản phẩm nào.</p>
        </div>
      )}
    </div>
  );
}
