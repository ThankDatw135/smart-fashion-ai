"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleUnauthorized = () => {
      // Clear client-side store
      logout();

      // Clear cookies for Next.js middleware / proxy
      document.cookie = "auth-token=; path=/; max-age=0;";
      document.cookie = "user-role=; path=/; max-age=0;";

      // Show toast
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

      // Redirect to login
      router.push("/login");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [router, logout]);

  return <>{children}</>;
}
