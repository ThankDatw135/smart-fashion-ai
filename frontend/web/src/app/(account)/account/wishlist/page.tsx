import { Metadata } from "next";
import { ProductGrid } from "@/components/product/ProductGrid";
import { MOCK_PRODUCTS } from "@/mocks/products.mock";

export const metadata: Metadata = {
  title: "Sản phẩm yêu thích | Antigravity Store",
  description: "Danh sách sản phẩm được yêu thích",
};

export default function WishlistPage() {
  // Use first 4 products as mocked wishlist
  const wishlistProducts = MOCK_PRODUCTS.slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">Sản phẩm yêu thích</h1>
        <p className="text-sm text-muted-foreground">Lưu trữ danh sách thời trang bạn muốn mua vào bất kỳ lúc nào.</p>
      </div>

      {wishlistProducts.length > 0 ? (
        <ProductGrid products={wishlistProducts} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-background/50 border border-dashed rounded-xl">
          <p className="text-muted-foreground">Bạn chưa yêu thích sản phẩm nào.</p>
        </div>
      )}
    </div>
  );
}
