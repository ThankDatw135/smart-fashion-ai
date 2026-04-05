"use client";

import { motion } from "framer-motion";
import { Users, ShieldCheck } from "lucide-react";

const STATS = [
  {
    icon: Users,
    value: "10,000+",
    label: "Người dùng được AI lên đồ mỗi tháng",
  },
  {
    icon: ShieldCheck,
    value: "95%",
    label: "Mức độ hài lòng về tư vấn viên AI",
  },
];

export function StatsSection() {
  return (
    <section className="py-12 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.value}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-6 p-6 lg:p-8 rounded-2xl bg-muted transition-all duration-300 hover:bg-primary/5 group"
          >
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
              <stat.icon className="h-7 w-7 lg:h-8 lg:w-8" />
            </div>
            <div>
              <h3 className="text-2xl lg:text-3xl font-heading font-bold">{stat.value}</h3>
              <p className="text-muted-foreground font-medium text-sm lg:text-base">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
