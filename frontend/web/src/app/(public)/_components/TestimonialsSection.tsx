"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Minh Anh",
    title: "Marketing Executive",
    avatar: "/images/avatars/minh-anh.jpg",
    quote:
      "AI Stylist thực sự hiểu phong cách của mình. Mình đã tiết kiệm được rất nhiều thời gian mỗi sáng chọn đồ đi làm!",
  },
  {
    name: "Hoàng Nam",
    title: "Kỹ sư Phần mềm",
    avatar: "/images/avatars/hoang-nam.jpg",
    quote:
      "Lúc đầu mình khá nghi ngờ nhưng những gợi ý phối đồ của AI rất chất lượng, hợp thời và đúng gu mình thích.",
  },
  {
    name: "Linh Chi",
    title: "Fashion Blogger",
    avatar: "/images/avatars/linh-chi.jpg",
    quote:
      "Đây là công cụ tuyệt vời cho những ai muốn thử nghiệm phong cách mới mà không lo bị 'fail'. Một cuộc cách mạng thời trang!",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">
            Người Dùng Nói Gì?
          </h2>
          {/* Rating summary */}
          <div className="flex justify-center items-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-5 w-5 fill-yellow-400 text-yellow-400"
              />
            ))}
            <span className="ml-2 font-bold">4.9/5 dựa trên 5,000+ đánh giá</span>
          </div>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card p-6 lg:p-8 rounded-2xl shadow-sm border border-border/5"
            >
              {/* User info */}
              <div className="flex items-center gap-4 mb-5 lg:mb-6">
                <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-muted overflow-hidden relative shrink-0">
                  <Image
                    src={item.avatar}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.title}</p>
                </div>
              </div>
              {/* Quote */}
              <p className="text-muted-foreground italic leading-relaxed text-sm lg:text-base">
                &quot;{item.quote}&quot;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
