"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useVerifyOtp } from "@/hooks/useAuth";

export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { mutateAsync: verifyOtp, isPending: isLoading } = useVerifyOtp();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(value.length - 1); // Keep only the last char
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value !== "" && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      toast.error("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    try {
      const res = await verifyOtp({ email, otp: otpValue });
      
      toast.success("Xác thực OTP thành công!");
      router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${res?.data?.resetToken || "verified_token"}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-2xl bg-background/60 backdrop-blur-xl ring-1 ring-border/50">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight">Xác thực OTP</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Vui lòng nhập mã bảo mật 6 số vừa được gửi đến 
            <br/> 
            <span className="font-semibold text-foreground text-sm">{email || "email của bạn"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-4 my-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-semibold bg-background border border-border shadow-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              ))}
            </div>

            <Button type="submit" className="w-full h-11 text-base group" disabled={isLoading || otp.join("").length < 6}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Xác Thực
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center border-t border-border/50 p-6 bg-muted/20">
          <p className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors cursor-pointer font-medium">
            Gửi lại mã OTP
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
