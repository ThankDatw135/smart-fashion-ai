import { Metadata } from "next";
import { HeroSection } from "./_components/HeroSection";
import { StatsSection } from "./_components/StatsSection";
import { AIFeaturesSection } from "./_components/AIFeaturesSection";
import { FeaturedProductsSection } from "./_components/FeaturedProductsSection";
import { AIRecommendationsSection } from "./_components/AIRecommendationsSection";
import { TestimonialsSection } from "./_components/TestimonialsSection";
import { ChatWidget } from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: "Smart Fashion AI — Trải nghiệm Tủ đồ Tương lai",
  description:
    "Cá nhân hóa outfit theo gu của bạn với công nghệ AI thông minh nhất. Chatbot tư vấn, tìm kiếm hình ảnh, gợi ý cá nhân hóa.",
  openGraph: {
    title: "Smart Fashion AI — Trải nghiệm Tủ đồ Tương lai",
    description: "Website bán quần áo tích hợp AI — Tìm kiếm thông minh, Chatbot tư vấn, Gợi ý cá nhân hóa.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <AIFeaturesSection />
      <FeaturedProductsSection />
      <AIRecommendationsSection />
      <TestimonialsSection />
      <ChatWidget />
    </>
  );
}
