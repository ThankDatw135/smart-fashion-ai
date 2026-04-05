"use client";

import { motion } from "framer-motion";
import { MessageSquare, ScanSearch, LayoutGrid, TrendingUp } from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Trợ Lý Chat Stylist",
    description: "Trò chuyện 24/7 với AI để nhận lời khuyên phối đồ tức thì cho mọi sự kiện.",
  },
  {
    icon: ScanSearch,
    title: "Tìm Kiếm Thông Minh",
    description: "Tải ảnh bất kỳ outfit nào bạn thích, AI sẽ tìm sản phẩm tương tự trong kho.",
  },
  {
    icon: LayoutGrid,
    title: "Gợi Ý Cá Nhân Hoá",
    description: "Càng sử dụng, AI càng hiểu gu của bạn để đưa ra những đề xuất chính xác.",
  },
  {
    icon: TrendingUp,
    title: "Phân Tích Thấu Hiểu",
    description: "Phân tích xu hướng thị trường và dữ liệu cá nhân để tối ưu tủ đồ của bạn.",
  },
];

export function AIFeaturesSection() {
  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">
            Công nghệ AI đột phá
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Chúng tôi tái định nghĩa trải nghiệm mua sắm bằng những tính năng thông minh nhất.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-6 lg:p-8 rounded-2xl border border-border/10 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
            >
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-5 lg:mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
