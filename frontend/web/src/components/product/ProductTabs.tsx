"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  title: string;
  content: string;
}

interface ProductTabsProps {
  items: AccordionItem[];
}

export function ProductTabs({ items }: ProductTabsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="border-b border-border/30">
          <button
            onClick={() => toggle(i)}
            className="w-full py-4 flex justify-between items-center group"
          >
            <span className="font-heading font-semibold group-hover:text-primary transition-colors">
              {item.title}
            </span>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence initial={false}>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pb-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
