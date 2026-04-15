"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientOnly } from "@/components/helpers/ClientOnly";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { useAuthStore } from "@/stores/auth.store";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        router.replace("/login");
      }
    }
  }, [mounted, user, router]);

  if (!mounted || !user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="ml-4 font-medium text-lg">Đang xác thực quyền Admin...</span>
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="flex min-h-screen" suppressHydrationWarning>
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0" suppressHydrationWarning>
          <AdminHeader />
          <main className="flex-1 p-6 bg-muted/20">{children}</main>
        </div>
      </div>
    </ClientOnly>
  );
}
