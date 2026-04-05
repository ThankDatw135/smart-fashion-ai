"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useEffect, useState } from "react";

export function AccountHeader() {
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = mounted && user?.name ? user.name : "Bạn";

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-2">Xin chào, {displayName} 👋</h1>
      <p className="text-muted-foreground">Quản lý không gian tài khoản cá nhân và theo dõi đơn hàng của bạn.</p>
    </div>
  );
}
