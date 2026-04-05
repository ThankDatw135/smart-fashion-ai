"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ImageGalleryProps {
  images: { src: string; alt: string }[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] || images[0];

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
      {/* Vertical Thumbnails */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:w-20 xl:w-24 no-scrollbar">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-16 lg:w-full aspect-[4/5] rounded-lg overflow-hidden shrink-0 transition-all ${
              i === activeIndex
                ? "border-2 border-primary opacity-100"
                : "border border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <div className="relative w-full h-full bg-muted">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="flex-1 relative bg-muted rounded-xl overflow-hidden aspect-[4/5]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
