"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-background to-primary-container/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-12">
        {/* Left — Text content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-8"
        >
          {/* Label badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-wide uppercase">
            <Sparkles className="h-4 w-4" />
            Trải nghiệm Tủ đồ Tương lai
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold leading-[1.1] tracking-tight">
            AI Stylist Thấu Hiểu{" "}
            <span className="text-gradient-primary">Phong Cách</span> Của Bạn
          </h1>

          {/* Description */}
          <p className="text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Cá nhân hóa outfit theo gu của bạn với công nghệ AI thông minh nhất hiện nay.
            Thời trang không chỉ là mặc, đó là bản sắc.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Button asChild size="lg" className="rounded-full px-10 py-6 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/products">Bắt Đầu Tạo Kiểu</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-10 py-6 text-lg font-bold border-primary/10 hover:bg-muted transition-all">
              <Link href="/products?category=new">Khám Phá BST</Link>
            </Button>
          </div>
        </motion.div>

        {/* Right — Hero image + Chat overlay */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          {/* Background blurs */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-60" />

          {/* Main image */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/5]">
            <Image
              src="/images/hero-fashion.jpg"
              alt="Thời trang cao cấp — Smart Fashion AI"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            {/* AI Chat Overlay */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 glass-card p-4 sm:p-6 rounded-2xl border border-white/40 shadow-xl">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest">
                    AI Stylist Phản hồi
                  </p>
                  <p className="text-xs sm:text-sm font-semibold">Cố vấn trang phục trực tuyến</p>
                </div>
              </div>
              <div className="bg-background/50 p-3 sm:p-4 rounded-xl border border-primary/5 italic text-xs sm:text-sm text-muted-foreground">
                &quot;Dựa trên gu Minimalist của bạn, mình gợi ý phối chiếc Blazer kem
                này với quần lụa đen và phụ kiện vàng hồng để tạo sự thanh lịch tuyệt đối.&quot;
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
