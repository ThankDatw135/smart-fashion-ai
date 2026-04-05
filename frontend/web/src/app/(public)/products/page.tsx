import { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductListingClient } from "./_components/ProductListingClient";

export const metadata: Metadata = {
  title: "Tất Cả Sản Phẩm | Smart Fashion AI",
  description:
    "Khám phá phong cách cá nhân được tinh chỉnh bởi trí tuệ nhân tạo, từ thiết kế kinh điển đến xu hướng mới nhất.",
};

export default function ProductListingPage() {
  return (
    <main className="pt-6 pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Sản phẩm" },
        ]}
      />

      <header className="mb-10 lg:mb-12">
        <h1 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight mb-2">
          Tất Cả Sản Phẩm
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Khám phá phong cách cá nhân được tinh chỉnh bởi trí tuệ nhân tạo, từ
          những mẫu thiết kế kinh điển đến xu hướng mới nhất.
        </p>
      </header>

      <ProductListingClient />
    </main>
  );
}
