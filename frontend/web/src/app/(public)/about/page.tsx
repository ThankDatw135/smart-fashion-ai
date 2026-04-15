import { Metadata } from "next";
import Image from "next/image";
import { TrendingUp, Users, Leaf, ShieldCheck } from "lucide-react";
import { getStaticContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Về chúng tôi | Antigravity Store",
  description: "Câu chuyện và tầm nhìn của thương hiệu thời trang Antigravity Tích hợp AI",
};

export default function AboutPage() {
  const content = getStaticContent().about || {};

  const values = [
    { icon: TrendingUp, title: "Sáng Tạo Vượt Bậc", desc: "Không ngừng đổi mới trong thiết kế và nâng cấp công nghệ mua sắm AI." },
    { icon: Leaf, title: "Phát Triển Bền Vững", desc: "Sử dụng vật liệu xanh, giảm thiểu rác thải thời trang qua quy trình may mặc chuẩn." },
    { icon: Users, title: "Lấy Khách Hàng Làm Trọng Tâm", desc: "Mọi sản phẩm và tính năng đều sinh ra để phục vụ trải nghiệm của chính bạn." },
    { icon: ShieldCheck, title: "Chất Lượng Vượt Thời Gian", desc: "Mỗi đường kim mũi chỉ đều được QC (Quality Control) gắt gao trước khi đóng gói." },
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-primary/5">
        <div className="container relative z-10 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 tracking-tight" dangerouslySetInnerHTML={{ __html: content.heading }}>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {content.description}
          </p>
        </div>
        {/* Background Decorative */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Story Section */}
      <section className="py-20 container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative aspect-[4/5] rounded-3xl overflow-hidden bg-muted">
            <Image src="/images/hero-fashion.jpg" alt="Antigravity Team" fill className="object-cover" />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">{content.storyHeading}</h2>
            {content.storyLines?.map((line: string, i: number) => (
              <p key={i} className="text-muted-foreground text-lg leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Giá trị cốt lõi</h2>
            <p className="text-muted-foreground">Những triết lý dẫn đường cho mọi quyết định thiết kế và kinh doanh tại Antigravity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="bg-background p-8 rounded-3xl shadow-sm border text-center hover:-translate-y-2 transition-transform duration-300">
                  <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 transform rotate-3">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-3">{v.title}</h3>
                  <p className="text-muted-foreground max-w-[250px] mx-auto">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
