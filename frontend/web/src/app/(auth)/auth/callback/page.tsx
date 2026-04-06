"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { AuthAPI } from "@/services/auth.api";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const fetched = useRef(false);
  
  useEffect(() => {
    if (fetched.current) return;
    
    const token = searchParams.get("token");
    if (token) {
      fetched.current = true;
      // Set token to store temporarily so Axios interceptor uses it
      useAuthStore.setState({ token });
      
      AuthAPI.getMe().then((res) => {
        const user = res.data.user ? res.data.user : res.data;
        const normalizedRole = (user.role || "user").toLowerCase() as "user" | "admin" | "super_admin";
        
        setAuth({
          id: user.id,
          email: user.email,
          name: user.fullName || user.name || user.email,
          role: normalizedRole,
          avatar: user.avatarUrl,
          phone: user.phone,
        }, token);
        
        // Cập nhật cookies cho middleware
        if (typeof document !== "undefined") {
          document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
          document.cookie = `user-role=${normalizedRole}; path=/; max-age=${60 * 60 * 24 * 7}`;
        }
        
        toast.success("Đăng nhập thành công!");
        
        if (normalizedRole === "admin" || normalizedRole === "super_admin") {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
      }).catch((err) => {
        useAuthStore.setState({ token: null });
        toast.error("Xác thực thất bại. Vui lòng đăng nhập lại.");
        router.replace("/login");
      });
    } else {
      // Fallback behavior if no token
      const user = useAuthStore.getState().user;
      if (user) {
        if (user.role === "admin" || user.role === "super_admin" || (user.role as string) === "ADMIN") {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
      } else {
        router.replace("/login");
      }
    }
  }, [router, searchParams, setAuth]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-background/60 backdrop-blur-xl rounded-xl ring-1 ring-border/50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium animate-pulse">
        Đang xác thực thông tin đăng nhập...
      </p>
    </div>
  );
}
