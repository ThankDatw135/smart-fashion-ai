"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập địa chỉ email");
      return;
    }

    setIsLoading(true);
    try {
      // In a real app: await api.post('/auth/forgot-password', { email });
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      toast.success("Mã xác minh đã được gửi đến email của bạn.");
    } catch (error) {
      toast.error("Có lỗi xảy ra. Hãy chắc chắn email này đã được đăng ký.");
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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Kiểm tra email</CardTitle>
            <CardDescription className="text-base mx-auto max-w-xs">
              Chúng tôi đã gửi một liên kết khôi phục mật khẩu đến
              <br />
              <strong className="font-semibold text-foreground">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4 pb-10">
            <Button 
              className="w-full h-11" 
              onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(email)}`)}
            >
              Nhập mã OTP thủ công
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-11" 
              onClick={() => setIsSuccess(false)}
            >
              Thử lại với email khác
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
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
          <CardTitle className="text-3xl font-bold tracking-tight">Quên mật khẩu?</CardTitle>
          <CardDescription className="text-base">
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email đăng nhập</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base group" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Gửi Yêu Cầu
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center border-t border-border/50 p-6 bg-muted/20">
          <Link
            href="/login"
            className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            Quay lại đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
