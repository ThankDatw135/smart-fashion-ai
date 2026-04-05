"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const OUTFIT_SETS = [
  {
    id: "set1",
    style: "Phong Cách Đường Phố",
    title: "The Urban Explorer",
    image: "/images/outfits/streetwear.jpg",
  },
  {
    id: "set2",
    style: "Phong Cách Thanh Lịch",
    title: "Midnight Gala Look",
    image: "/images/outfits/elegant.jpg",
  },
  {
    id: "set3",
    style: "Phong Cách Công Sở",
    title: "Modern Professional",
    image: "/images/outfits/office.jpg",
  },
  {
    id: "set4",
    style: "Phong Cách Tối Giản",
    title: "Autumn Cozy Vibes",
    image: "/images/outfits/minimalist.jpg",
  },
];

export function AIRecommendationsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 420;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-20 lg:py-24 overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-10 lg:mb-12 flex items-end justify-between">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-2">
            Được Phối Dành Riêng Cho Bạn
          </h2>
          <p className="text-primary font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Powered by AI Personalization
          </p>
        </div>
        <div className="hidden sm:flex gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-11 w-11"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-11 w-11"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Horizontal scroll carousel */}
      <div
        ref={scrollRef}
        className="flex gap-6 lg:gap-8 overflow-x-auto px-6 lg:px-8 hide-scrollbar pb-8 snap-x"
      >
        {OUTFIT_SETS.map((set, i) => (
          <motion.div
            key={set.id}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[300px] sm:min-w-[360px] lg:min-w-[400px] snap-start flex-shrink-0"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-lg group cursor-pointer">
              <Image
                src={set.image}
                alt={set.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-1000"
                sizes="400px"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {/* Text */}
              <div className="absolute bottom-5 left-5 right-5 lg:bottom-6 lg:left-6 lg:right-6">
                <p className="text-white/80 text-sm font-medium mb-1">{set.style}</p>
                <h4 className="text-white text-xl lg:text-2xl font-bold">{set.title}</h4>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
