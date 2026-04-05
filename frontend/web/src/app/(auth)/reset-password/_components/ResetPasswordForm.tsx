"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/services/api";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Đánh giá độ mạnh mật khẩu cơ bản (tái sử dụng logic)
  const strength = (() => {
    let s = 0;
    if (password.length > 5) s += 20;
    if (password.length > 7) s += 20;
    if (/[A-Z]/.test(password)) s += 20;
    if (/[0-9]/.test(password)) s += 20;
    if (/[^A-Za-z0-9]/.test(password)) s += 20;
    return s;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);
    try {
      // In a real app: await api.post('/auth/reset-password', { email, token, newPassword: password });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      toast.success("Mật khẩu đã được đặt lại thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra, token có thể đã hết hạn. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-2xl bg-background/60 backdrop-blur-xl ring-1 ring-border/50 text-center">
          <CardHeader className="space-y-4 pb-6 pt-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Hoàn tất!</CardTitle>
            <CardDescription className="text-base mx-auto max-w-xs">
              Mật khẩu của bạn đã được thay đổi thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4 pb-10">
            <Button 
              className="w-full h-11" 
              onClick={() => router.push("/login")}
            >
              Về trang đăng nhập
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  // Block thay đổi nếu thiếu token
  if (!token) {
    return (
      <Card className="border-0 shadow-2xl bg-background/60 backdrop-blur-xl ring-1 ring-border/50 text-center p-8">
        <h2 className="text-xl font-bold text-destructive mb-2">Liên kết không hợp lệ</h2>
        <p className="text-muted-foreground mb-6">Token xác thực không tồn tại. Vui lòng yêu cầu cấp lại mật khẩu.</p>
        <Button onClick={() => router.push("/forgot-password")}>Quay lại Quên Mật Khẩu</Button>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-2xl bg-background/60 backdrop-blur-xl ring-1 ring-border/50">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-base">
            Nhập mật khẩu mới cho tài khoản {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${
                        strength < 40 ? "bg-red-500" : strength < 80 ? "bg-amber-500" : "bg-emerald-500"
                      } transition-all duration-300`}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {strength < 40 ? "Yếu" : strength < 80 ? "TB" : "Mạnh"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background/50 h-11 pr-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base mt-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Lưu Mật Khẩu Mới"
              )}
            </Button>
          </form>

        </CardContent>
      </Card>
    </motion.div>
  );
}
