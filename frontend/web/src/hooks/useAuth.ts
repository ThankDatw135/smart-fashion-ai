import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { AuthAPI } from "@/services/auth.api";

// Hook đăng nhập
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      AuthAPI.login(credentials),
    onSuccess: (res) => {
      // C3 fix: Backend returns 'accessToken', not 'token'
      const { accessToken, user } = res.data;
      // H7 fix: Normalize role to lowercase
      const normalizedRole = (user.role || "user").toLowerCase() as "user" | "admin" | "super_admin";

      setAuth(
        {
          id: user.id,
          email: user.email,
          name: user.fullName || user.email,
          role: normalizedRole,
        },
        accessToken
      );

      // Set cookies for middleware to read (server-side route guard)
      if (typeof document !== "undefined") {
        document.cookie = `auth-token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
        document.cookie = `user-role=${normalizedRole}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
    },
  });
}

// Hook đăng ký
export function useRegister() {
  return useMutation({
    mutationFn: (data: Record<string, any>) => AuthAPI.register(data),
  });
}

// Hook xác minh email
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (dto: { email: string; otp: string }) => AuthAPI.verifyEmail(dto),
  });
}

// Hook quên mật khẩu
export function useForgotPassword() {
  return useMutation({
    mutationFn: (dto: { email: string }) => AuthAPI.forgotPassword(dto),
  });
}

// Hook xác minh OTP
export function useVerifyOtp() {
  return useMutation({
    mutationFn: (dto: { email: string; otp: string }) => AuthAPI.verifyOtp(dto),
  });
}

// Hook reset mật khẩu
export function useResetPassword() {
  return useMutation({
    mutationFn: (dto: { resetToken: string; newPassword: string }) => AuthAPI.resetPassword(dto),
  });
}

// Hook đăng xuất — M6 fix: redirect after logout
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return useMutation({
    mutationFn: () => AuthAPI.logout(),
    onSuccess: () => {
      logout();
      // Clear cookies
      if (typeof document !== "undefined") {
        document.cookie = "auth-token=; path=/; max-age=0";
        document.cookie = "user-role=; path=/; max-age=0";
      }
      // M6 fix: Redirect to homepage after logout
      router.push("/");
    },
  });
}
